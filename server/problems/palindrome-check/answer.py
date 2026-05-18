def isPalindrome(s):
    return s == s[::-1]


if __name__ == "__main__":
    s = input().strip()
    print(isPalindrome(s))

