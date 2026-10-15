"""Re-aligns a magenta-screen layer onto its master with a similarity transform (scale+rotate+shift).

Usage: python scripts/assets/register.py <layer.png> <master.png> <out.png>
Writes the aligned layer (still on magenta) and prints scale / shift / inlier stats.
"""
import sys
import cv2
import numpy as np

layer_p, master_p, out_p = sys.argv[1:4]
L = cv2.imread(layer_p); M = cv2.imread(master_p)
h, w = M.shape[:2]
b, g, r = cv2.split(L)
content = ~((r > 200) & (g < 70) & (b > 200))
mask = cv2.dilate(content.astype(np.uint8) * 255, np.ones((5, 5), np.uint8))
mask = cv2.erode(mask, np.ones((15, 15), np.uint8))  # ignore the magenta fringe

sift = cv2.SIFT_create(8000)
kl, dl = sift.detectAndCompute(cv2.cvtColor(L, cv2.COLOR_BGR2GRAY), mask)
km, dm = sift.detectAndCompute(cv2.cvtColor(M, cv2.COLOR_BGR2GRAY), None)
matches = cv2.BFMatcher().knnMatch(dl, dm, k=2)
good = [m for m, n in matches if m.distance < 0.75 * n.distance]
src = np.float32([kl[m.queryIdx].pt for m in good]); dst = np.float32([km[m.trainIdx].pt for m in good])
A, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=4)
scale = float(np.hypot(A[0, 0], A[1, 0]))
aligned = cv2.warpAffine(L, A, (w, h), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT, borderValue=(255, 0, 255))
cv2.imwrite(out_p, aligned)
print(f"matches={len(good)} inliers={int(inl.sum())} scale={scale:.3f} shift=({A[0,2]:.0f},{A[1,2]:.0f})")
