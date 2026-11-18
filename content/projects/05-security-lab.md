---
title: Detection Lab — Active Directory
slug: detection-lab
track: security
featured: true
order: 14
year: 2025
status: active
role: Built and operated
period: 2024 – present
type: Security engineering · Detection
summary: A self-contained Windows domain and Linux network built to generate realistic telemetry, then instrumented to see whether common attacker behavior actually shows up in the logs.
stack: [Windows Server, Active Directory, Kali Linux, Wireshark, Sysmon, VirtualBox, pfSense]
---

## Why a lab

Certifications establish vocabulary; a lab establishes whether you can actually
see anything. The question I built this to answer is not "can I run the tool" —
it's **"when someone does this, what does it leave behind, and would a defender
notice?"**

Everything here runs on hardware I own, on an isolated network segment with no
route to anything I don't control.

## Environment

| Host | Role |
| --- | --- |
| DC01 | Windows Server 2019 domain controller, DNS, 5 user accounts, group policy |
| WS01 / WS02 | Domain-joined Windows workstations with Sysmon deployed by GPO |
| Collector | Log aggregation and search |
| Attack host | Kali Linux, isolated segment |
| Gateway | pfSense, segmentation and traffic capture point |

![Lab topology: DC01 and WS01 on the domain segment, Kali on an isolated segment, with the telemetry path from SPN enumeration through event review to hardening.](/img/lab-topology.svg)

## How I work through a scenario

Each writeup in the [lab notebook](/lab/) follows the same five steps, which is
the order a detection engineer actually works in:

1. **Scenario** — the behavior being simulated, mapped to a MITRE ATT&CK technique
2. **Topology** — which hosts, which accounts, which privileges
3. **Execution** — what was run, at a level of detail that explains the telemetry
   without being a how-to
4. **Artifacts** — the Windows Event IDs, Sysmon events, and packet-level evidence
   it produced
5. **Detection and hardening** — the query that catches it, and the control that
   prevents it

## What the lab has covered

- Domain build-out, group policy, and baseline hardening against CIS Benchmark guidance
- Sysmon deployment and tuning to cut noise without losing the signal
- Network traffic analysis in Wireshark, run from the Kali host, capturing and
  inspecting suspicious traffic on the lab segment
- Credential hygiene testing and password policy validation
- Kerberos service-ticket telemetry (T1558.003) — SPN enumeration and the Event
  ID 4769 records it produces, written up in the lab notebook

## What I'd build next

- Ship logs into a real SIEM and write detections as versioned rules
- Automate the whole build with Terraform or Ansible so it's reproducible
- Add a Linux server and cover the equivalent techniques there
