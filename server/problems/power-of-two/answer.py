def isPowerOfTwo(n):
    return n > 0 and (n & (n - 1)) == 0

if __name__ == "__main__":
    import sys
    n = int(sys.stdin.read().strip())
    print(isPowerOfTwo(n))
