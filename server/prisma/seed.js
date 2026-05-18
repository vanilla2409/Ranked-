import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.problem.createMany({
    data: [
      {
        slug: 'sum-of-even',
        description: `## Sum of Even Numbers

Given an array of integers, return the sum of all even numbers in the array.

### Input Format
- First line: \`N\` (number of elements)  
- Second line: \`N\` space-separated integers

### Output Format
- A single integer — the **sum of even numbers**

### Constraints
- \`1 ≤ N ≤ 10^5\`  
- \`-10^9 ≤ arr[i] ≤ 10^9\`

### Example

**Input**
\`\`\`
5
1 2 3 4 5
\`\`\`

**Output**
\`\`\`
6
\`\`\`
`,
        codeSnippet: `def sum_of_even(arr):\n    ## Your implementation here!\n`
      },
      {
        slug: 'palindrome-check',
        description: `## Palindrome Check

Check whether a given string is a palindrome.

### Input Format
- A single line: a string \`s\`

### Output Format
- \`True\` if the string is a palindrome, otherwise \`False\`

### Constraints
- \`1 ≤ len(s) ≤ 10^5\`
- Input string will only contain lowercase alphabets.

### Example

**Input**
\`\`\`
racecar
\`\`\`

**Output**
\`\`\`
True
\`\`\`
`,
        codeSnippet: `def isPalindrome(s):\n    ## Your implementation here!\n`
      },
      {
        slug: 'three-sum',
        description: `## 3Sum Problem

Given an array \`nums\`, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i ≠ j ≠ k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.

### Input Format
- First line: \`N\` (number of elements)
- Second line: \`N\` space-separated integers

### Output Format
- List of triplets (in any order), each on a new line

### Constraints
- \`3 ≤ N ≤ 10^3\`
- \`-10^5 ≤ nums[i] ≤ 10^5\`

### Example

**Input**
\`\`\`
6
-1 0 1 2 -1 -4
\`\`\`

**Output**
\`\`\`
[-1, -1, 2]
[-1, 0, 1]
\`\`\`
`,
        codeSnippet: `def three_sum(nums):\n    ## Your implementation here!\n`
      },
      {
        slug: 'roman-to-integer',
        description: `## Roman to Integer

Convert a Roman numeral to an integer.

### Input Format
- A single line: a Roman numeral string \`s\`

### Output Format
- An integer representing the Roman numeral

### Constraints
- \`1 ≤ len(s) ≤ 15\`
- \`s\` is guaranteed to be a valid Roman numeral in the range \`[1, 3999]\`

### Example

**Input**
\`\`\`
XIV
\`\`\`

**Output**
\`\`\`
14
\`\`\`
`,
        codeSnippet: `def romanToInt(s):\n    ## Your implementation here!\n`
      },
      {
        slug: 'two-sum',
        description: `## Two Sum

Given N numbers and a target, find the indices of the two numbers that add up to the target. You may assume that each input has exactly one solution, and you may not use the same element twice.

### Input Format
- First line: \`N\` and \`Target\` (space-separated)
- Second line: \`N\` space-separated integers

### Output Format
- Two space-separated indices in ascending order (e.g. \`0 1\`)

### Constraints
- \`2 ≤ N ≤ 10^3\`
- \`-10^9 ≤ nums[i] ≤ 10^9\`

### Example

**Input**
\`\`\`
4 9
2 7 11 15
\`\`\`

**Output**
\`\`\`
0 1
\`\`\`
`,
        codeSnippet: `def twoSum(nums, target):\n    ## Your implementation here!\n`
      },
      {
        slug: 'reverse-string',
        description: `## Reverse String

Reverse a given string.

### Input Format
- A single line: a string \`s\`

### Output Format
- The reversed string

### Example

**Input**
\`\`\`
hello
\`\`\`

**Output**
\`\`\`
olleh
\`\`\`
`,
        codeSnippet: `def reverseString(s):\n    ## Your implementation here!\n`
      },
      {
        slug: 'fibonacci',
        description: `## N-th Fibonacci Number

Compute the N-th Fibonacci number. The sequence is defined as F(0) = 0, F(1) = 1, and F(n) = F(n-1) + F(n-2) for n >= 2.

### Input Format
- A single line containing an integer \`N\`

### Output Format
- The N-th Fibonacci number

### Example

**Input**
\`\`\`
5
\`\`\`

**Output**
\`\`\`
5
\`\`\`
`,
        codeSnippet: `def fibonacci(n):\n    ## Your implementation here!\n`
      },
      {
        slug: 'fizz-buzz',
        description: `## FizzBuzz

For numbers from 1 to N:
- Print "Fizz" if divisible by 3
- Print "Buzz" if divisible by 5
- Print "FizzBuzz" if divisible by both 3 and 5
- Otherwise print the number itself

### Input Format
- A single integer \`N\`

### Output Format
- N lines of output

### Example

**Input**
\`\`\`
5
\`\`\`

**Output**
\`\`\`
1
2
Fizz
4
Buzz
\`\`\`
`,
        codeSnippet: `def fizzBuzz(n):\n    ## Your implementation here!\n`
      },
      {
        slug: 'valid-parentheses',
        description: `## Valid Parentheses

Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.
An input string is valid if:
- Open brackets must be closed by the same type of brackets.
- Open brackets must be closed in the correct order.

### Input Format
- A single string \`s\`

### Output Format
- \`True\` if valid, otherwise \`False\`

### Example

**Input**
\`\`\`
()[]{}
\`\`\`

**Output**
\`\`\`
True
\`\`\`
`,
        codeSnippet: `def isValid(s):\n    ## Your implementation here!\n`
      },
      {
        slug: 'factorial',
        description: `## Factorial

Compute the factorial of a non-negative integer N.

### Input Format
- A single integer \`N\`

### Output Format
- Factorial of \`N\`

### Example

**Input**
\`\`\`
5
\`\`\`

**Output**
\`\`\`
120
\`\`\`
`,
        codeSnippet: `def factorial(n):\n    ## Your implementation here!\n`
      },
      {
        slug: 'prime-check',
        description: `## Prime Check

Determine if a given integer N is a prime number.

### Input Format
- A single integer \`N\`

### Output Format
- \`True\` if \`N\` is prime, otherwise \`False\`

### Example

**Input**
\`\`\`
7
\`\`\`

**Output**
\`\`\`
True
\`\`\`
`,
        codeSnippet: `def isPrime(n):\n    ## Your implementation here!\n`
      },
      {
        slug: 'anagram-check',
        description: `## Anagram Check

Check if two given strings s1 and s2 are anagrams of each other. An anagram is a word formed by rearranging the letters of another word.

### Input Format
- A single line containing two space-separated strings \`s1\` and \`s2\`

### Output Format
- \`True\` if they are anagrams, otherwise \`False\`

### Example

**Input**
\`\`\`
listen silent
\`\`\`

**Output**
\`\`\`
True
\`\`\`
`,
        codeSnippet: `def isAnagram(s1, s2):\n    ## Your implementation here!\n`
      },
      {
        slug: 'binary-search',
        description: `## Binary Search

Given a sorted array of N integers and a target, find the index of the target using binary search. If not found, return -1.

### Input Format
- First line: \`N\` and \`Target\` (space-separated)
- Second line: \`N\` space-separated integers in ascending order

### Output Format
- Index of target or \`-1\`

### Example

**Input**
\`\`\`
5 6
1 2 4 6 8
\`\`\`

**Output**
\`\`\`
3
\`\`\`
`,
        codeSnippet: `def binarySearch(arr, target):\n    ## Your implementation here!\n`
      },
      {
        slug: 'find-max',
        description: `## Find Maximum Element

Find the maximum value in an array of N integers.

### Input Format
- First line: \`N\`
- Second line: \`N\` space-separated integers

### Output Format
- The maximum integer value

### Example

**Input**
\`\`\`
5
3 1 9 4 5
\`\`\`

**Output**
\`\`\`
9
\`\`\`
`,
        codeSnippet: `def findMax(arr):\n    ## Your implementation here!\n`
      },
      {
        slug: 'count-vowels',
        description: `## Count Vowels

Count the total number of vowels ('a', 'e', 'i', 'o', 'u', case-insensitive) in a string.

### Input Format
- A single string \`s\`

### Output Format
- Integer count of vowels

### Example

**Input**
\`\`\`
RankedBattle
\`\`\`

**Output**
\`\`\`
4
\`\`\`
`,
        codeSnippet: `def countVowels(s):\n    ## Your implementation here!\n`
      },
      {
        slug: 'merge-sorted-lists',
        description: `## Merge Sorted Lists

Merge two sorted integer arrays into a single sorted array.

### Input Format
- First line: \`N\` and \`M\` (sizes of two arrays)
- Second line: \`N\` space-separated integers
- Third line: \`M\` space-separated integers

### Output Format
- A single line of space-separated sorted integers representing the merged array

### Constraints
- \`1 ≤ N, M ≤ 10^3\`

### Example

**Input**
\`\`\`
3 3
1 3 5
2 4 6
\`\`\`

**Output**
\`\`\`
1 2 3 4 5 6
\`\`\`
`,
        codeSnippet: `def mergeSortedLists(arr1, arr2):\n    ## Your implementation here!\n`
      },
      {
        slug: 'remove-duplicates',
        description: `## Remove Duplicates

Given an array of integers, remove duplicates and return unique integers in ascending sorted order.

### Input Format
- First line: \`N\`
- Second line: \`N\` space-separated integers

### Output Format
- Space-separated unique integers in ascending sorted order

### Example

**Input**
\`\`\`
6
4 3 4 1 2 2
\`\`\`

**Output**
\`\`\`
1 2 3 4
\`\`\`
`,
        codeSnippet: `def removeDuplicates(arr):\n    ## Your implementation here!\n`
      },
      {
        slug: 'power-of-two',
        description: `## Power of Two

Determine if a given non-negative integer N is a power of two. An integer n is a power of two if there exists an integer x such that n == 2^x.

### Input Format
- A single integer \`N\`

### Output Format
- \`True\` if \`N\` is a power of two, otherwise \`False\`

### Example

**Input**
\`\`\`
16
\`\`\`

**Output**
\`\`\`
True
\`\`\`
`,
        codeSnippet: `def isPowerOfTwo(n):\n    ## Your implementation here!\n`
      },
      {
        slug: 'length-of-last-word',
        description: `## Length of Last Word

Given a string s consisting of words and spaces, return the length of the last word in the string. A word is a maximal substring consisting of non-space characters only.

### Input Format
- A single line consisting of words and spaces

### Output Format
- Length of the last word

### Example

**Input**
\`\`\`
Hello World
\`\`\`

**Output**
\`\`\`
5
\`\`\`
`,
        codeSnippet: `def lengthOfLastWord(s):\n    ## Your implementation here!\n`
      }
    ],
    skipDuplicates: true,
  });

  console.log("Problems seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })