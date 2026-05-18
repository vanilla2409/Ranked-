def factorial(n):
    if n <= 1: return 1
    res = 1
    for i in range(2, n + 1):
        res *= i
    return res

if __name__ == "__main__":
    import sys
    n = int(sys.stdin.read().strip())
    print(factorial(n))
