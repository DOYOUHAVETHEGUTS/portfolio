---
title: Service ticket requests, and what they look like in the log
slug: service-ticket-telemetry
date: 2025-05-18
technique: T1558.003
tactic: Credential Access
environment: Isolated Windows domain (DC01, WS01, Kali attack host)
summary: Simulating service ticket abuse in the lab, then working backwards to the Event IDs and query that would catch it.
stack: [Windows Server, Active Directory, Sysmon, PowerShell, Wireshark]
---

## Scenario

An authenticated user requests service tickets for accounts across the domain in
order to attack them offline. The interesting property, defensively, is that
nothing about the request is abnormal on its own — it's ordinary Kerberos. The
signal is in the *pattern* and the *encryption type*.

## Topology

Three VMs running on VirtualBox, all using NAT adapters. The domain machines
(DC01 and WS01) shared a network segment; the Kali attack host sat on a
separate, isolated segment.

| Host | Role | OS |
| --- | --- | --- |
| DC01 | Domain controller, DNS, Active Directory | Windows Server 2019 |
| WS01 | Domain-joined workstation, Sysmon deployed | Windows 10 |
| Kali | Attack host, isolated segment | Kali Linux |

The domain used existing default service accounts rather than purpose-built lab
accounts — which is a realistic starting condition: most environments have SPNs
registered on built-in service accounts that nobody audits because nobody created
them intentionally. Sysmon was deployed on WS01 and generating event data
alongside the standard Windows Security log on DC01.

## Execution

From the Kali attack host, used `ldapsearch` to query the domain controller's
LDAP interface for accounts that had a `servicePrincipalName` attribute set —
the defining property of a Kerberoastable account:

```bash
ldapsearch -x -H ldap://DC01 -D "user@domain.local" -W \
  -b "DC=domain,DC=local" "(servicePrincipalName=*)" \
  sAMAccountName servicePrincipalName
```

The query returned the default service accounts the domain had registered SPNs
against. The important observation is that nothing about the LDAP query itself
is anomalous — enumerating directory attributes is ordinary domain activity —
which is exactly what makes this class of technique difficult to gate on.

Subsequent authentication and ticket activity during the lab generated **Event
ID 4769** (Kerberos service ticket request) entries on DC01's Security log.
The exercise stopped at the telemetry stage: confirming the events appeared,
locating them in the log, and correlating them with the directory enumeration
that preceded them. No hash cracking was attempted.

## Artifacts

| Source | What appeared |
| --- | --- |
| Security log, DC01 | Event ID 4769 — Kerberos service ticket requests against SPN-bearing accounts, generated during the LDAP enumeration and subsequent authentication activity |

The encryption type on the 4769 events was not recorded during the lab.
In a production detection, filtering on `TicketEncryptionType = 0x17` (RC4)
is what separates the signal from the background — without that discriminator,
4769 alone is too noisy to alert on.

## Detection

The naive detection — alert on every 4769 — is useless in any real environment;
it fires on ordinary authentication constantly. The discriminators that make it
actionable are encryption type, volume, and account behavior.

A detection worth building:

```text
# Pseudo-query — adapt to your SIEM
EventID = 4769
  AND TicketEncryptionType = 0x17    # RC4; flag if your environment enforces AES
| stats count by ServiceName, ClientAddress, TimeWindow(5m)
| where count > threshold            # burst of requests in a short window
  OR ServiceName in (accounts_that_normally_use_AES)
```

The encryption type filter is the highest-signal discriminator: if your
environment enforces AES-256 for Kerberos, any RC4 ticket request is
immediately anomalous regardless of volume. Without enforced AES, volume and
account deviation carry more weight — an account requesting tickets for five
different services in two minutes is the pattern to catch, not any single event.

## Hardening

The following are recommendations identified from the lab — none were
implemented as configuration changes in the environment itself.

- **Enforce AES encryption for Kerberos; disable RC4.** RC4 (encryption type
  0x17) is the signal that makes Kerberoasting tickets cheap to crack offline.
  Forcing AES-256 doesn't prevent ticket requests, but it raises the cost of
  offline cracking significantly. This is the highest-leverage single control
  against this technique.
- **Audit and remove unnecessary SPNs.** The attack surface is every account
  with an SPN registered against it. Default service accounts accumulate SPNs
  over time that nothing actively uses; auditing the directory for
  `servicePrincipalName=*` and removing stale registrations shrinks the
  Kerberoastable population without any other change.
- **Increase password length on SPN-bearing accounts.** Kerberoastable accounts
  with short or common passwords are crackable offline regardless of encryption
  type. For any account that must carry an SPN, a 25+ character random password
  is the practical floor.

## What I took from it

The clarifying moment wasn't the attack — it was watching Event ID 4769 fire
constantly during normal lab activity. Kerberos is doing its job every few
seconds; the event itself tells you almost nothing. What matters is the
encryption type, the requesting account, and the volume over a window of time.
A single 4769 is background noise. Twenty 4769s with RC4 encryption from an
account that normally authenticates with AES — that's the signal.

The lab also made RC4 feel concrete rather than theoretical. I understood
abstractly that RC4 tickets are cheaper to crack offline, but watching it as
a configuration flag that changes the practical cost of an attack made it land
differently. Encryption policy is a detection control, not just a compliance
checkbox: if an environment enforces AES, a Kerberoasting attempt either fails
or produces AES-encrypted hashes where the offline cracking math is meaningfully
harder.

The bigger takeaway: exploitation is the easy part. Running the enumeration
took minutes. Building a detection that holds up against the baseline noise of
legitimate Kerberos traffic — one that fires on the pattern rather than the
event — is the actual work. If I ran this lab again I'd spend more time
on the detection side: building the threshold query before running the attack,
then verifying it catches what I did and doesn't fire on everything else.
