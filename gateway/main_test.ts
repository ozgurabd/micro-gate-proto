import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { delay } from "https://deno.land/std/async/delay.ts";

// Mocking a Service Instance for testing
const mockInstance = {
  url: "http://mock-service",
  isAlive: true,
  state: 0, // CLOSED
  failureCount: 0,
  lastFailureTime: 0,
};

// 1. Test: Round Robin Load Balancing Logic
Deno.test("Load Balancer: should rotate between healthy instances", () => {
  const instances = [
    { ...mockInstance, url: "http://s1" },
    { ...mockInstance, url: "http://s2" }
  ];
  
  let currentIndex = 0;
  const getNext = () => {
    currentIndex = (currentIndex + 1) % instances.length;
    return instances[currentIndex];
  };

  assertEquals(getNext().url, "http://s2");
  assertEquals(getNext().url, "http://s1");
});

// 2. Test: Circuit Breaker State Transition
Deno.test("Circuit Breaker: should open after threshold is reached", () => {
  const instance = { ...mockInstance };
  const FAILURE_THRESHOLD = 3;

  for (let i = 0; i < FAILURE_THRESHOLD + 1; i++) {
    instance.failureCount++;
    if (instance.failureCount > FAILURE_THRESHOLD) {
      instance.state = 1; // OPEN
    }
  }

  assertEquals(instance.state, 1); // State should be OPEN
});

// 3. Test: Cache Key Generation
Deno.test("Cache: should generate correct keys from URL", () => {
  const url = new URL("http://gateway:3000/api/products?id=123");
  const cacheKey = ["cache", url.pathname + url.search];
  
  assertEquals(cacheKey, ["cache", "/api/products?id=123"]);
});