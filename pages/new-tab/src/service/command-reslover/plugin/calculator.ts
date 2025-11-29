import type { ICommandReslover, ICommandResult } from './protocol'
import { Calculator, History, Copy, Trash2 } from 'lucide-react'
import { t } from '@extension/i18n'

const CALCULATOR_HISTORY_KEY = 'calculator_history'
const MAX_HISTORY_ITEMS = 20

interface CalculatorHistoryItem {
  expression: string
  result: string
  timestamp: number
}

// Get history from localStorage
function getHistory(): CalculatorHistoryItem[] {
  try {
    const history = localStorage.getItem(CALCULATOR_HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

// Save history to localStorage
function saveHistory(history: CalculatorHistoryItem[]): void {
  try {
    localStorage.setItem(CALCULATOR_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)))
  } catch {
    // Ignore storage errors
  }
}

// Add item to history
function addToHistory(expression: string, result: string): void {
  const history = getHistory()
  // Don't add duplicate consecutive entries
  if (history.length > 0 && history[0].expression === expression) {
    return
  }
  history.unshift({
    expression,
    result,
    timestamp: Date.now(),
  })
  saveHistory(history)
}

// Clear history
function clearHistory(): void {
  try {
    localStorage.removeItem(CALCULATOR_HISTORY_KEY)
  } catch {
    // Ignore storage errors
  }
}

// Copy to clipboard
async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
  }
}

// Token types for the expression parser
type TokenType = 'number' | 'operator' | 'lparen' | 'rparen'

interface Token {
  type: TokenType
  value: string
}

// Tokenize the expression
function tokenize(expression: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const expr = expression.replace(/\s+/g, '') // Remove all whitespace

  while (i < expr.length) {
    const char = expr[i]

    // Handle numbers (including decimals)
    if (/[\d.]/.test(char)) {
      let num = ''
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        num += expr[i]
        i++
      }
      tokens.push({ type: 'number', value: num })
      continue
    }

    // Handle operators
    if (['+', '-', '*', '/', '%', '^'].includes(char)) {
      // Handle negative numbers at the start or after an operator/open paren
      if (
        char === '-' &&
        (tokens.length === 0 || tokens[tokens.length - 1].type === 'operator' || tokens[tokens.length - 1].type === 'lparen')
      ) {
        let num = '-'
        i++
        while (i < expr.length && /[\d.]/.test(expr[i])) {
          num += expr[i]
          i++
        }
        if (num !== '-') {
          tokens.push({ type: 'number', value: num })
          continue
        } else {
          // Just a standalone minus, treat as operator
          i-- // Go back
        }
      }
      tokens.push({ type: 'operator', value: char })
      i++
      continue
    }

    // Handle parentheses
    if (char === '(' || char === '[' || char === '{') {
      tokens.push({ type: 'lparen', value: '(' })
      i++
      continue
    }

    if (char === ')' || char === ']' || char === '}') {
      tokens.push({ type: 'rparen', value: ')' })
      i++
      continue
    }

    // Handle Chinese operators
    if (char === '×' || char === '✕') {
      tokens.push({ type: 'operator', value: '*' })
      i++
      continue
    }

    if (char === '÷') {
      tokens.push({ type: 'operator', value: '/' })
      i++
      continue
    }

    // Skip unknown characters
    i++
  }

  return tokens
}

// Check if a string contains only integer values (for BigInt optimization)
function isIntegerExpression(tokens: Token[]): boolean {
  return tokens.every(token => {
    if (token.type === 'number') {
      return !token.value.includes('.') && !token.value.includes('e') && !token.value.includes('E')
    }
    // Division can produce non-integers
    if (token.type === 'operator' && token.value === '/') {
      return false
    }
    return true
  })
}

// BigInt constants
const BIGINT_ZERO = BigInt(0)
const BIGINT_ONE = BigInt(1)
const BIGINT_TWO = BigInt(2)

// BigInt power function (to avoid ES2016 requirement)
function bigPow(base: bigint, exponent: bigint): bigint {
  if (exponent < BIGINT_ZERO) {
    return BIGINT_ZERO // BigInt doesn't support negative exponents, return 0
  }
  if (exponent === BIGINT_ZERO) {
    return BIGINT_ONE
  }
  let result = BIGINT_ONE
  let b = base
  let e = exponent
  while (e > BIGINT_ZERO) {
    if (e % BIGINT_TWO === BIGINT_ONE) {
      result *= b
    }
    b *= b
    e = e / BIGINT_TWO
  }
  return result
}

// Parse and evaluate expression using shunting-yard algorithm
function evaluate(tokens: Token[], useBigInt: boolean): string {
  const outputQueue: Token[] = []
  const operatorStack: Token[] = []

  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '%': 2,
    '^': 3,
  }

  const rightAssociative = new Set(['^'])

  for (const token of tokens) {
    if (token.type === 'number') {
      outputQueue.push(token)
    } else if (token.type === 'operator') {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1].type === 'operator' &&
        ((rightAssociative.has(token.value) &&
          precedence[operatorStack[operatorStack.length - 1].value] > precedence[token.value]) ||
          (!rightAssociative.has(token.value) &&
            precedence[operatorStack[operatorStack.length - 1].value] >= precedence[token.value]))
      ) {
        outputQueue.push(operatorStack.pop()!)
      }
      operatorStack.push(token)
    } else if (token.type === 'lparen') {
      operatorStack.push(token)
    } else if (token.type === 'rparen') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'lparen') {
        outputQueue.push(operatorStack.pop()!)
      }
      if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'lparen') {
        operatorStack.pop()
      }
    }
  }

  while (operatorStack.length > 0) {
    outputQueue.push(operatorStack.pop()!)
  }

  // Evaluate the RPN expression
  const evalStack: (number | bigint)[] = []

  for (const token of outputQueue) {
    if (token.type === 'number') {
      if (useBigInt) {
        evalStack.push(BigInt(token.value))
      } else {
        evalStack.push(parseFloat(token.value))
      }
    } else if (token.type === 'operator') {
      const b = evalStack.pop()!
      const a = evalStack.pop()!

      if (useBigInt) {
        const bigA = a as bigint
        const bigB = b as bigint
        switch (token.value) {
          case '+':
            evalStack.push(bigA + bigB)
            break
          case '-':
            evalStack.push(bigA - bigB)
            break
          case '*':
            evalStack.push(bigA * bigB)
            break
          case '/':
            evalStack.push(bigA / bigB)
            break
          case '%':
            evalStack.push(bigA % bigB)
            break
          case '^':
            evalStack.push(bigPow(bigA, bigB))
            break
        }
      } else {
        const numA = a as number
        const numB = b as number
        switch (token.value) {
          case '+':
            evalStack.push(numA + numB)
            break
          case '-':
            evalStack.push(numA - numB)
            break
          case '*':
            evalStack.push(numA * numB)
            break
          case '/':
            evalStack.push(numA / numB)
            break
          case '%':
            evalStack.push(numA % numB)
            break
          case '^':
            evalStack.push(Math.pow(numA, numB))
            break
        }
      }
    }
  }

  const result = evalStack[0]
  if (useBigInt) {
    return result.toString()
  }

  // Format the result for display
  const numResult = result as number
  if (Number.isInteger(numResult) && Math.abs(numResult) < Number.MAX_SAFE_INTEGER) {
    return numResult.toString()
  }
  // Handle very large or very small numbers
  if (Math.abs(numResult) > 1e15 || (Math.abs(numResult) < 1e-15 && numResult !== 0)) {
    return numResult.toExponential(10)
  }
  // Round to avoid floating point errors
  return parseFloat(numResult.toPrecision(15)).toString()
}

// Check if a string looks like a math expression
function isMathExpression(query: string): boolean {
  // Must contain at least one digit and one operator
  const hasDigit = /\d/.test(query)
  const hasOperator = /[+\-*/%^×÷]/.test(query)
  // Should not contain letters (except for some edge cases)
  const hasLetters = /[a-zA-Z]/.test(query)
  // Require at least one operator to be considered a math expression
  return hasDigit && hasOperator && !hasLetters
}

// Calculate the expression
function calculate(expression: string): string | null {
  try {
    const tokens = tokenize(expression)
    if (tokens.length === 0) return null

    // Check if we have at least one number
    const hasNumber = tokens.some(t => t.type === 'number')
    if (!hasNumber) return null

    // Use BigInt for integer-only expressions to handle large numbers
    const useBigInt = isIntegerExpression(tokens)
    return evaluate(tokens, useBigInt)
  } catch {
    return null
  }
}

export const calculatorResolver: ICommandReslover = {
  name: t('calculator'),
  settings: {
    priority: -10, // High priority for quick math
    active: true,
    includeInGlobal: true,
    activeKey: '=',
  },
  properties: {
    label: 'Calculator',
  },
  resolve: async params => {
    const results: ICommandResult[] = []
    let query = params.query

    // Strip the activeKey prefix if present
    if (query.startsWith('=')) {
      query = query.slice(1).trim()
    }

    // If query is empty, show history
    if (query.length === 0) {
      const history = getHistory()
      if (history.length === 0) {
        return null
      }

      // Add clear history option
      results.push({
        id: 'calc-clear-history',
        title: t('calculatorClearHistory'),
        description: t('calculatorClearHistoryDesc'),
        IconType: Trash2,
        onSelect: () => {
          clearHistory()
        },
      })

      // Add history items
      history.slice(0, 10).forEach((item, index) => {
        results.push({
          id: `calc-history-${index}`,
          title: `${item.expression} = ${item.result}`,
          description: t('calculatorClickToCopy'),
          IconType: History,
          onSelect: () => {
            copyToClipboard(item.result)
          },
        })
      })

      return results
    }

    // Try to calculate the expression
    if (!isMathExpression(query)) {
      return null
    }

    const result = calculate(query)
    if (result === null) {
      return null
    }

    // Add the result
    results.push({
      id: 'calc-result',
      title: `${query} = ${result}`,
      description: t('calculatorClickToCopy'),
      IconType: Calculator,
      onSelect: () => {
        copyToClipboard(result)
        addToHistory(query, result)
      },
    })

    // Add copy option
    results.push({
      id: 'calc-copy',
      title: result,
      description: t('calculatorCopyResult'),
      IconType: Copy,
      onSelect: () => {
        copyToClipboard(result)
        addToHistory(query, result)
      },
    })

    return results
  },
}
