# Compares a new clip to a database of parent videos using a two-phase
# comparison: fast hashing for exact matches and ORB feature detection
# for visually similar (edited, resized, etc.) matches.
# cd "D:\notes\programming\templateCode\video-hashing-and-data-storage_orb"


# video_hashing_parallel_sampled.py

import os
import cv2
import numpy as np
import shutil
import tempfile
import concurrent.futures
from pathlib import Path
from tqdm import tqdm

# --- Constants ---
ORB_FEATURES = 500
MIN_MATCH_COUNT = 10

# --- Helper Functions ---
def extract_frames(video_path, output_dir, sample_per_second=True):
    """
    Extracts frames from video. If sample_per_second, saves ~1 frame per second.
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video {video_path}")

    # Determine frame sampling interval
    if sample_per_second:
        fps = cap.get(cv2.CAP_PROP_FPS) or 1
        interval = max(1, int(fps))
    else:
        interval = 1

    frame_idx = 0
    saved = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % interval == 0:
            frame_path = output_dir / f"frame_{saved:05d}.jpg"
            cv2.imwrite(str(frame_path), frame)
            saved += 1
        frame_idx += 1
    cap.release()
    return list(output_dir.glob("frame_*.jpg"))


def compute_orb_descriptors(image_path):
    image = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        return None
    orb = cv2.ORB_create(nfeatures=ORB_FEATURES)
    _, descriptors = orb.detectAndCompute(image, None)
    return descriptors


def match_frame_cpu(args):
    """
    Unpacked wrapper for multiprocessing: computes descriptors and matches against DB.
    """
    frame_path, descriptors_db = args
    des_new = compute_orb_descriptors(frame_path)
    if des_new is None:
        return 0
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = []
    for db_desc in descriptors_db:
        if db_desc is None:
            continue
        matches.extend(bf.match(des_new, db_desc))
    # Count good matches
    return sum(1 for m in matches if m.distance < 50)


def video_frame_comparison(parent_videos, new_clip_frames):
    """
    Phase 1: ORB descriptor DB build
    Phase 2: Parallel matching
    """
    # Build descriptor database from parent videos
    print("Building descriptor database from parent videos...")
    descriptors_db = []
    for parent_dir in parent_videos:
        for frame in sorted(parent_dir.glob("frame_*.jpg")):
            des = compute_orb_descriptors(frame)
            if des is not None:
                descriptors_db.append(des)
    print(f"Collected {len(descriptors_db)} frame descriptors.")

    # Prepare args for each new frame
    args = [(fp, descriptors_db) for fp in new_clip_frames]

    # Parallel matching using all CPU cores
    print("Matching frames in parallel across CPU cores...")
    with concurrent.futures.ProcessPoolExecutor(max_workers=os.cpu_count()) as executor:
        match_counts = list(tqdm(executor.map(match_frame_cpu, args), total=len(args)))

    # Determine strong matches
    threshold = max(3, int(0.05 * len(new_clip_frames)))
    strong = sum(1 for cnt in match_counts if cnt >= MIN_MATCH_COUNT)
    confidence = strong / len(new_clip_frames) if new_clip_frames else 0.0
    print(f"Strong frame matches: {strong}/{len(new_clip_frames)}")
    return confidence, match_counts

if __name__ == '__main__':
    # 1) Paths - Point to the FOLDER containing your parent videos
    parent_video_dir = Path(r'D:/content_creation/dead_by_daylight/pcClips/202507')
    new_clip = r'D:/content_creation/uploadClips/test121.mp4'
    
    # List of temporary directories to clean up later
    temp_dirs = []

    # 2) Extract frames from the new clip
    new_clip_temp_dir = Path(tempfile.mkdtemp(prefix="new_clip_"))
    temp_dirs.append(new_clip_temp_dir)
    print(f"Extracting frames from new clip: {new_clip}...")
    new_frames = extract_frames(new_clip, new_clip_temp_dir, sample_per_second=True)
    print(f"Saved {len(new_frames)} frames from new clip.")

    # 3) Find and extract frames from all parent videos
    parent_frame_dirs = []
    # Find all .mp4 files in the parent directory. You can add more extensions like '*.mov'.
    parent_videos_to_process = list(parent_video_dir.glob('*.mp4'))
    print(f"\nFound {len(parent_videos_to_process)} parent videos to process.")

    for video_file in parent_videos_to_process:
        parent_temp_dir = Path(tempfile.mkdtemp(prefix="parent_vid_"))
        temp_dirs.append(parent_temp_dir)
        print(f"Extracting frames from parent video: {video_file.name}...")
        extract_frames(video_file, parent_temp_dir, sample_per_second=True)
        parent_frame_dirs.append(parent_temp_dir)

    # 4) Compare
    if not parent_frame_dirs:
        print("\nNo parent frames were extracted. Cannot perform comparison.")
    else:
        confidence, scores = video_frame_comparison(parent_frame_dirs, new_frames)
        print(f"\nFinal confidence: {confidence:.2%}")

    # 5) Cleanup all temporary directories
    print("\nCleaning up temporary directories...")
    for d in temp_dirs:
        shutil.rmtree(d)
    print("Cleanup complete
