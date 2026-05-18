def binarySearch(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

if __name__ == "__main__":
    import sys
    lines = sys.stdin.read().splitlines()
    if lines:
        n, target = map(int, lines[0].split())
        arr = list(map(int, lines[1].split()))
        print(binarySearch(arr, target))
