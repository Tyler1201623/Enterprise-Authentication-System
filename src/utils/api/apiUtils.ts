/**
 * Utility for simulating API calls with customizable delay
 */

/**
 * Simulates an API call with a configurable delay
 * @param result The result to return after the delay
 * @param delay Delay in milliseconds
 * @returns A promise that resolves with the result after the delay
 */
export const simulateApiCall = <T>(result: T, delay = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(result);
    }, delay);
  });
};

/**
 * Simulates an API error with a configurable delay
 * @param errorMessage The error message
 * @param delay Delay in milliseconds
 * @returns A promise that rejects with the error after the delay
 */
export const simulateApiError = (
  errorMessage: string,
  delay = 500
): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, delay);
  });
};

/**
 * Simulates an API call with a random success/failure outcome
 * @param successResult The result to return if successful
 * @param errorMessage The error message if failed
 * @param successRate Probability of success (0-1)
 * @param delay Delay in milliseconds
 */
export const simulateRandomOutcome = <T>(
  successResult: T,
  errorMessage: string,
  successRate = 0.8,
  delay = 500
): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < successRate) {
        resolve(successResult);
      } else {
        reject(new Error(errorMessage));
      }
    }, delay);
  });
};
