def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

if __name__ == "__main__":
    import sys
    lines = sys.stdin.read().splitlines()
    if lines:
        n, target = map(int, lines[0].split())
        nums = list(map(int, lines[1].split()))
        ans = twoSum(nums, target)
        print(f"{ans[0]} {ans[1]}")
