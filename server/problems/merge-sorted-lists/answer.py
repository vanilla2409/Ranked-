def mergeSortedLists(arr1, arr2):
    res = []
    i, j = 0, 0
    while i < len(arr1) and j < len(arr2):
        if arr1[i] < arr2[j]:
            res.append(arr1[i])
            i += 1
        else:
            res.append(arr2[j])
            j += 1
    res.extend(arr1[i:])
    res.extend(arr2[j:])
    return res

if __name__ == "__main__":
    import sys
    lines = sys.stdin.read().splitlines()
    if len(lines) >= 3:
        arr1 = list(map(int, lines[1].split())) if lines[1].strip() else []
        arr2 = list(map(int, lines[2].split())) if lines[2].strip() else []
        ans = mergeSortedLists(arr1, arr2)
        print(" ".join(map(str, ans)))
