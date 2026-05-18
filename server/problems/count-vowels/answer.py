def countVowels(s):
    vowels = set('aeiouAEIOU')
    return sum(1 for char in s if char in vowels)

if __name__ == "__main__":
    import sys
    s = sys.stdin.read().strip()
    print(countVowels(s))
