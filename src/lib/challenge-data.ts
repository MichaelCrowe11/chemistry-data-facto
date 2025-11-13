import { CodeChallenge } from '@/types/challenges'

export const codeChallenges: CodeChallenge[] = [
  {
    id: 'hello-world-js',
    title: 'Hello World Function',
    description: 'Create a function that returns "Hello, World!" - the classic first programming challenge.',
    difficulty: 'beginner',
    category: 'javascript',
    estimatedTime: '2 min',
    xpReward: 10,
    language: 'javascript',
    starterCode: `function helloWorld() {
  // Write your code here
  
}`,
    solution: `function helloWorld() {
  return "Hello, World!";
}`,
    hints: [
      { level: 1, text: 'Remember to use the return keyword' },
      { level: 2, text: 'The string should be exactly "Hello, World!" with the comma and exclamation mark', codeSnippet: 'return "Hello, World!";' }
    ],
    testCases: [
      { id: 'test1', input: '', expectedOutput: 'Hello, World!', description: 'Should return "Hello, World!"' }
    ],
    learningObjectives: [
      'Understand function syntax',
      'Use return statements',
      'Work with strings'
    ]
  },
  {
    id: 'sum-two-numbers',
    title: 'Sum Two Numbers',
    description: 'Write a function that takes two numbers and returns their sum.',
    difficulty: 'beginner',
    category: 'javascript',
    estimatedTime: '3 min',
    xpReward: 15,
    language: 'javascript',
    starterCode: `function sum(a, b) {
  // Write your code here
  
}`,
    solution: `function sum(a, b) {
  return a + b;
}`,
    hints: [
      { level: 1, text: 'Use the addition operator (+)' },
      { level: 2, text: 'Add the two parameters and return the result', codeSnippet: 'return a + b;' }
    ],
    testCases: [
      { id: 'test1', input: '1, 2', expectedOutput: '3', description: 'sum(1, 2) should return 3' },
      { id: 'test2', input: '10, 5', expectedOutput: '15', description: 'sum(10, 5) should return 15' },
      { id: 'test3', input: '-3, 3', expectedOutput: '0', description: 'sum(-3, 3) should return 0' },
      { id: 'test4', input: '0, 0', expectedOutput: '0', description: 'sum(0, 0) should return 0', hidden: true }
    ],
    learningObjectives: [
      'Work with function parameters',
      'Perform arithmetic operations',
      'Handle different number types'
    ]
  },
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    description: 'Create a function that reverses a given string.',
    difficulty: 'beginner',
    category: 'javascript',
    estimatedTime: '5 min',
    xpReward: 20,
    language: 'javascript',
    starterCode: `function reverseString(str) {
  // Write your code here
  
}`,
    solution: `function reverseString(str) {
  return str.split('').reverse().join('');
}`,
    hints: [
      { level: 1, text: 'You can convert a string to an array of characters' },
      { level: 2, text: 'Arrays have a reverse() method' },
      { level: 3, text: 'Use split(), reverse(), and join() methods', codeSnippet: `str.split('').reverse().join('')` }
    ],
    testCases: [
      { id: 'test1', input: '"hello"', expectedOutput: 'olleh', description: 'reverseString("hello") should return "olleh"' },
      { id: 'test2', input: '"world"', expectedOutput: 'dlrow', description: 'reverseString("world") should return "dlrow"' },
      { id: 'test3', input: '"12345"', expectedOutput: '54321', description: 'reverseString("12345") should return "54321"' },
      { id: 'test4', input: '""', expectedOutput: '', description: 'reverseString("") should return ""', hidden: true }
    ],
    learningObjectives: [
      'Manipulate strings',
      'Use array methods',
      'Chain method calls'
    ]
  },
  {
    id: 'find-largest',
    title: 'Find Largest Number',
    description: 'Write a function that finds the largest number in an array.',
    difficulty: 'beginner',
    category: 'algorithms',
    estimatedTime: '7 min',
    xpReward: 25,
    language: 'javascript',
    starterCode: `function findLargest(numbers) {
  // Write your code here
  
}`,
    solution: `function findLargest(numbers) {
  return Math.max(...numbers);
}`,
    hints: [
      { level: 1, text: 'You can use Math.max() to find the maximum value' },
      { level: 2, text: 'Use the spread operator (...) to pass array elements as arguments' },
      { level: 3, text: 'Math.max(...numbers) will return the largest number', codeSnippet: 'return Math.max(...numbers);' }
    ],
    testCases: [
      { id: 'test1', input: '[1, 5, 3, 9, 2]', expectedOutput: '9', description: 'Should return 9' },
      { id: 'test2', input: '[-1, -5, -3]', expectedOutput: '-1', description: 'Should handle negative numbers' },
      { id: 'test3', input: '[42]', expectedOutput: '42', description: 'Should work with single element' },
      { id: 'test4', input: '[100, 200, 50, 175]', expectedOutput: '200', description: 'Should find max in larger array', hidden: true }
    ],
    learningObjectives: [
      'Work with arrays',
      'Use built-in Math functions',
      'Understand the spread operator'
    ]
  },
  {
    id: 'palindrome-check',
    title: 'Palindrome Checker',
    description: 'Determine if a string is a palindrome (reads the same forwards and backwards).',
    difficulty: 'intermediate',
    category: 'algorithms',
    estimatedTime: '10 min',
    xpReward: 35,
    language: 'javascript',
    starterCode: `function isPalindrome(str) {
  // Write your code here
  
}`,
    solution: `function isPalindrome(str) {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}`,
    hints: [
      { level: 1, text: 'Convert the string to lowercase and remove non-alphanumeric characters' },
      { level: 2, text: 'Compare the cleaned string with its reverse' },
      { level: 3, text: 'Use replace() with regex to clean, then compare with reversed version', codeSnippet: `const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');` }
    ],
    testCases: [
      { id: 'test1', input: '"racecar"', expectedOutput: 'true', description: 'Should return true for "racecar"' },
      { id: 'test2', input: '"hello"', expectedOutput: 'false', description: 'Should return false for "hello"' },
      { id: 'test3', input: '"A man a plan a canal Panama"', expectedOutput: 'true', description: 'Should ignore spaces and case' },
      { id: 'test4', input: '"Was it a car or a cat I saw?"', expectedOutput: 'true', description: 'Should ignore punctuation', hidden: true }
    ],
    learningObjectives: [
      'String manipulation',
      'Regular expressions',
      'Case-insensitive comparisons'
    ]
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz Classic',
    description: 'Write a function that returns an array of numbers from 1 to n, but for multiples of 3 return "Fizz", for multiples of 5 return "Buzz", and for multiples of both return "FizzBuzz".',
    difficulty: 'intermediate',
    category: 'algorithms',
    estimatedTime: '12 min',
    xpReward: 40,
    language: 'javascript',
    starterCode: `function fizzBuzz(n) {
  // Write your code here
  
}`,
    solution: `function fizzBuzz(n) {
  const result = [];
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) {
      result.push("FizzBuzz");
    } else if (i % 3 === 0) {
      result.push("Fizz");
    } else if (i % 5 === 0) {
      result.push("Buzz");
    } else {
      result.push(i);
    }
  }
  return result;
}`,
    hints: [
      { level: 1, text: 'Use a loop to iterate from 1 to n' },
      { level: 2, text: 'Check divisibility by 15 first (both 3 and 5)' },
      { level: 3, text: 'Use the modulo operator (%) to check divisibility', codeSnippet: 'if (i % 15 === 0) { ... }' }
    ],
    testCases: [
      { id: 'test1', input: '5', expectedOutput: '[1,2,"Fizz",4,"Buzz"]', description: 'fizzBuzz(5) should return correct array' },
      { id: 'test2', input: '15', expectedOutput: '[1,2,"Fizz",4,"Buzz","Fizz",7,8,"Fizz","Buzz",11,"Fizz",13,14,"FizzBuzz"]', description: 'Should handle FizzBuzz case' },
      { id: 'test3', input: '3', expectedOutput: '[1,2,"Fizz"]', description: 'fizzBuzz(3) should work correctly', hidden: true }
    ],
    learningObjectives: [
      'Control flow with conditionals',
      'Loop iteration',
      'Modulo operator usage',
      'Array construction'
    ]
  },
  {
    id: 'array-chunk',
    title: 'Chunk Array',
    description: 'Split an array into groups of a specified size.',
    difficulty: 'intermediate',
    category: 'data-structures',
    estimatedTime: '15 min',
    xpReward: 45,
    language: 'javascript',
    starterCode: `function chunkArray(array, size) {
  // Write your code here
  
}`,
    solution: `function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}`,
    hints: [
      { level: 1, text: 'Loop through the array incrementing by the chunk size' },
      { level: 2, text: 'Use slice() to extract portions of the array' },
      { level: 3, text: 'Increment by size in each iteration: i += size', codeSnippet: 'array.slice(i, i + size)' }
    ],
    testCases: [
      { id: 'test1', input: '[1,2,3,4,5], 2', expectedOutput: '[[1,2],[3,4],[5]]', description: 'Should chunk into groups of 2' },
      { id: 'test2', input: '[1,2,3,4,5,6], 3', expectedOutput: '[[1,2,3],[4,5,6]]', description: 'Should chunk into groups of 3' },
      { id: 'test3', input: '[1,2,3], 5', expectedOutput: '[[1,2,3]]', description: 'Should handle size larger than array', hidden: true }
    ],
    learningObjectives: [
      'Array manipulation',
      'Loop control',
      'Slice method usage'
    ]
  },
  {
    id: 'react-counter',
    title: 'React Counter Component',
    description: 'Build a simple counter component with increment and decrement buttons.',
    difficulty: 'beginner',
    category: 'react',
    estimatedTime: '8 min',
    xpReward: 30,
    language: 'typescript',
    starterCode: `import { useState } from 'react'
import { Button } from '@/components/ui/button'

function Counter() {
  // Write your code here
  
  return (
    <div className="flex items-center gap-4">
      {/* Add your UI here */}
    </div>
  )
}

export default Counter`,
    solution: `import { useState } from 'react'
import { Button } from '@/components/ui/button'

function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <div className="flex items-center gap-4">
      <Button onClick={() => setCount(count - 1)}>-</Button>
      <span className="text-2xl font-bold">{count}</span>
      <Button onClick={() => setCount(count + 1)}>+</Button>
    </div>
  )
}

export default Counter`,
    hints: [
      { level: 1, text: 'Use the useState hook to manage the count' },
      { level: 2, text: 'Add onClick handlers to update the count' },
      { level: 3, text: 'Display the count between the buttons', codeSnippet: 'const [count, setCount] = useState(0)' }
    ],
    testCases: [
      { id: 'test1', input: 'Initial render', expectedOutput: 'count = 0', description: 'Should start at 0' },
      { id: 'test2', input: 'Click increment', expectedOutput: 'count = 1', description: 'Should increment' },
      { id: 'test3', input: 'Click decrement', expectedOutput: 'count = -1', description: 'Should decrement' }
    ],
    learningObjectives: [
      'useState hook',
      'Event handlers',
      'Component rendering'
    ],
    relatedTutorials: ['vr-code-view']
  },
  {
    id: 'debounce-function',
    title: 'Implement Debounce',
    description: 'Create a debounce function that delays function execution until after a specified wait time has elapsed since the last call.',
    difficulty: 'advanced',
    category: 'javascript',
    estimatedTime: '20 min',
    xpReward: 60,
    language: 'javascript',
    starterCode: `function debounce(func, wait) {
  // Write your code here
  
}`,
    solution: `function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}`,
    hints: [
      { level: 1, text: 'Use setTimeout to delay execution' },
      { level: 2, text: 'Clear the previous timeout on each call' },
      { level: 3, text: 'Return a new function that manages the timeout', codeSnippet: 'let timeout; return function(...args) { ... }' }
    ],
    testCases: [
      { id: 'test1', input: 'func, 100ms', expectedOutput: 'Delays execution', description: 'Should delay function call' },
      { id: 'test2', input: 'Multiple calls', expectedOutput: 'Only last call executes', description: 'Should cancel previous calls' },
      { id: 'test3', input: 'Arguments', expectedOutput: 'Passes arguments', description: 'Should preserve arguments', hidden: true }
    ],
    learningObjectives: [
      'Closures',
      'Higher-order functions',
      'Asynchronous timing',
      'Function context'
    ]
  },
  {
    id: 'binary-search',
    title: 'Binary Search Algorithm',
    description: 'Implement a binary search algorithm to find an element in a sorted array.',
    difficulty: 'advanced',
    category: 'algorithms',
    estimatedTime: '25 min',
    xpReward: 75,
    language: 'javascript',
    starterCode: `function binarySearch(array, target) {
  // Write your code here
  
}`,
    solution: `function binarySearch(array, target) {
  let left = 0;
  let right = array.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (array[mid] === target) {
      return mid;
    } else if (array[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}`,
    hints: [
      { level: 1, text: 'Use two pointers: left and right' },
      { level: 2, text: 'Calculate the middle index and compare with target' },
      { level: 3, text: 'Adjust left or right pointer based on comparison', codeSnippet: 'const mid = Math.floor((left + right) / 2)' }
    ],
    testCases: [
      { id: 'test1', input: '[1,2,3,4,5,6,7,8,9], 5', expectedOutput: '4', description: 'Should find element at index 4' },
      { id: 'test2', input: '[1,2,3,4,5], 10', expectedOutput: '-1', description: 'Should return -1 if not found' },
      { id: 'test3', input: '[1,2,3,4,5], 1', expectedOutput: '0', description: 'Should find first element' },
      { id: 'test4', input: '[10,20,30,40,50], 50', expectedOutput: '4', description: 'Should find last element', hidden: true }
    ],
    learningObjectives: [
      'Binary search algorithm',
      'Time complexity O(log n)',
      'Divide and conquer approach',
      'Edge case handling'
    ]
  }
]
