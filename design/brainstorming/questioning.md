# prompt: What are some good prompts I can use to optimize the output of an LLM with the following concept

![crate_planner_spec](../../src/concepts/CratePlanner.spec)

# response:

Excellent question! Using a specification file (like a `.spec` test file) as the foundation for your prompts is a highly effective technique. It provides the LLM with crucial context, constraints, and a "source of truth" for the desired behavior.

Based on the concept of a `CratePlanner` as defined in a spec file, we can infer its purpose: to efficiently and correctly place items of varying dimensions and weights into a set of crates with specific capacity constraints.

Here are several categories of good prompts you can use, ranging from code generation to documentation and analysis.

---

### Foundational Step: The Context-Setting Prompt

Before any specific task, start your conversation with the LLM by providing the full context. This is the most critical step.

**Master Prompt Template:**

```
You are an expert TypeScript/JavaScript developer specializing in logistics algorithms and writing clean, maintainable, and well-tested code.

I am going to provide you with the content of a Jest/Jasmine specification file, `CratePlanner.spec.ts`. This file defines the required behavior, interfaces, and public API for a class named `CratePlanner`. This spec is the single source of truth. All code, documentation, and analysis you generate must strictly adhere to the tests and interfaces defined within it.

Here is the content of `CratePlanner.spec.ts`:

```
// [ PASTE THE ENTIRE CONTENT OF YOUR CratePlanner.spec FILE HERE ]
```

Now, based on the provided specification, please help me with the following tasks.
```

---

### Category 1: Code Generation & Implementation

These prompts ask the LLM to write the actual code based on the "contract" established by the spec file.

**Prompt 1.1: Full Class Implementation**

> Based on the spec, write the complete implementation for the `CratePlanner` class in TypeScript. Ensure the implementation is efficient and passes all the described tests. Add comments to explain the core logic of the packing algorithm you choose.

**Prompt 1.2: Implementing a Specific Method**

> Looking at the spec, focus on the tests related to adding a new item. Write just the `addItem()` method for the `CratePlanner` class. It should handle all edge cases described, such as items being too large, too heavy, or when a new crate is needed.

**Prompt 1.3: Generating Helper Types/Interfaces**

> The spec implies the existence of `Item` and `Crate` types. Based on the properties used in the tests (e.g., `width`, `height`, `depth`, `weight`, `maxWeight`), generate the TypeScript `interface` definitions for `Item`, `Crate`, and the final `Plan` that the planner should return.

---

### Category 2: Test Case Expansion

Use the LLM to think of edge cases you might have missed.

**Prompt 2.1: Generating New Edge Cases**

> Analyze the provided `CratePlanner.spec.ts`. What are some critical edge cases that are NOT currently tested? Generate 5 new `it(...)` test blocks in the same style as the existing file. Focus on scenarios like:
> *   Items with zero dimensions or weight.
> *   A list of items where no single item can fit into any crate.
> *   The interaction between max weight and max dimensions (e.g., a very light but large item).
> *   Perfectly fitting items that leave no remaining space.

**Prompt 2.2: Generating Test Data**

> I need to do more robust testing. Please generate a JSON object containing an array of 20 diverse `Item` objects and an array of 3 `Crate` objects that would represent a complex planning scenario. Include some items that are easy to fit, some that are awkward shapes, and at least two that won't fit at all.

---

### Category 3: Documentation & Explanation

LLMs excel at translating code logic into human-readable text.

**Prompt 3.1: Generating TSDoc / JSDoc Comments**

> Take the `CratePlanner` class implementation (or generate it first if you haven't) and add comprehensive TSDoc comments for the class itself and for all of its public methods. The comments should explain what each method does, its parameters (`@param`), and what it returns (`@returns`), referencing the logic defined in the spec.

**Prompt 3.2: Creating a README / Markdown Documentation**

> Write a `README.md` file for the `CratePlanner` module. It should include the following sections:
> *   **Overview:** A brief explanation of what the CratePlanner does.
> *   **Installation:** A placeholder for installation instructions.
> *   **API Reference:** Detail the `CratePlanner` class, its constructor, and public methods based on the spec.
> *   **Usage Example:** Provide a clear, simple code example of how to instantiate the planner, add items, and get the final plan.

**Prompt 3.3: Explaining the Logic**

> Explain the core logic of the packing algorithm required to make the tests in `CratePlanner.spec.ts` pass. Describe the problem (it's a variation of the Bin Packing Problem) and outline a step-by-step strategy to solve it. Explain it in a way a junior developer could understand.

---

### Category 4: Code Review & Refactoring

Use the LLM as a partner to improve existing code. (For this, you would provide your implementation along with the spec).

**Prompt 4.1: Critical Code Review**

> I am providing my implementation of the `CratePlanner` class, which is intended to pass the tests in the spec. Please act as a senior developer and perform a thorough code review. Look for:
> *   Potential bugs or logic errors.
> *   Performance bottlenecks in the packing algorithm.
> *   Violations of the SOLID principles.
> *   Code that is hard to read or maintain.
> *   Any deviation from the behavior defined in the spec.
>
> **[Paste your implementation here]**

**Prompt 4.2: Suggesting Refactors**

> Here is my current implementation of the `CratePlanner`. Based on the spec, suggest a refactoring that would make the code more modular and easier to test. For example, could the placement strategy be extracted into its own function or class? Provide the before-and-after code snippets.
>
> **[Paste your implementation here]**

---

### Best Practices for Using These Prompts:

1.  **Always Start with Context:** Never just ask "write the CratePlanner". Always use the foundational prompt to ground the LLM in the spec file's reality.
2.  **Be Specific in Your Request:** Notice how the prompts ask for a specific format (`JSON`, `README.md`, `it(...)` blocks) or a specific role ("act as a senior developer").
3.  **Iterate:** If the first output isn't perfect, give it feedback. For example: "That's a good start, but your packing algorithm doesn't account for the `maxWeight` constraint mentioned in the spec. Please revise it."

# prompt: Make them more specific

# response:

Of course. Let's refine the previous prompts by making them more specific, constrained, and directive. This reduces the LLM's ambiguity and forces it to produce higher-quality, more predictable results.

The key to making prompts more specific is to provide:
*   **A Persona:** "Act as a senior developer..."
*   **A Format:** "Provide the output as a JSON object..."
*   **Constraints:** "Do not use any external libraries."
*   **A Concrete Example:** "For instance, an item that is too heavy but not too large."
*   **A Process:** "First, outline the steps. Second, write the code."

Here are the revised, more specific prompts, building on the same foundational context.

***

### Foundational Step: The Enhanced Context-Setting Prompt

This version is slightly improved by asking the LLM to confirm its understanding, ensuring the context is properly loaded.

**Master Prompt Template v2:**

```
You are an expert TypeScript developer specializing in logistics and combinatorial optimization algorithms. Your goals are to write clean, performant, and robust code that adheres to the provided specification.

I am providing you with the content of a Jest specification file, `CratePlanner.spec.ts`. This file is the single source of truth for the behavior of a `CratePlanner` class. All code, documentation, and analysis you generate must strictly adhere to the tests and interfaces defined within it.

Here is the content of `CratePlanner.spec.ts`:

```
// \[ PASTE THE ENTIRE CONTENT OF YOUR CratePlanner.spec FILE HERE ]
```

Please confirm that you have read and understood the spec file. Then, await my next instruction.
```
*(Wait for the LLM's confirmation before proceeding with the tasks below.)*

***

### Category 1: Code Generation & Implementation (More Specific)

**Prompt 1.1: Constrained Class Implementation**

> Based on the spec, write the complete implementation for the `CratePlanner` class in TypeScript.
>
> **Constraints:**
> *   Implement a **First-Fit Decreasing (FFD)**-like algorithm. Specifically, iterate through the existing crates and place the item in the *first* crate where it fits. If it fits nowhere, create a new crate.
> *   The solution must be self-contained. **Do not use any external libraries** for the packing logic.
> *   Ensure all class properties are `private` and only expose the public methods defined by the tests.
> *   When an item cannot fit in any crate due to its dimensions or weight exceeding the crate's capacity, throw a specific `Error` with a message like "Item [item name/ID] is too large or heavy for any crate."
> *   Add TSDoc comments explaining the FFD logic and the time complexity of the `addItem` method.

**Why it's better:** It prescribes a specific algorithm (FFD), sets constraints (no libraries, private properties), and defines a precise error-handling mechanism, leading to a more predictable and robust implementation.

**Prompt 1.2: Precise Method Implementation with State Management**

> Write **only** the `getPlan()` method for the `CratePlanner` class.
>
> **Requirements:**
> *   The method should return a `Plan` object with a structure `{ crates: Crate[], unplacedItems: Item[] }`.
> *   Crucially, the returned object must be a **deep copy** of the planner's internal state. Modifying the returned plan should not affect the internal state of the `CratePlanner` instance.
> *   Include the TSDoc block for the method, specifying what it `@returns` and noting the deep copy behavior.

**Why it's better:** It focuses on a single method and introduces a critical software engineering concept (immutability/defensive copying), forcing the LLM to produce higher-quality, safer code.

***

### Category 2: Test Case Expansion (More Specific)

**Prompt 2.1: Persona-Driven Edge Case Generation**

> Act as a skeptical QA engineer trying to break the `CratePlanner` logic. Analyze the provided spec and generate exactly 5 new `it(...)` test blocks that target combinations of constraints the original tests might miss.
>
> **Focus specifically on:**
> 1.  An item that fits the dimensions but exceeds the `maxWeight` of a partially filled crate.
> 2.  An item that is extremely heavy but has almost zero volume.
> 3.  A sequence of adding items and then adding one giant item that forces a new crate to be created, even if there's total volume available across older crates.
> 4.  The case where the initial list of crates is empty.
> 5.  Adding an item with a negative or zero dimension/weight (this should likely throw an error, so write a test that expects an error).
>
> **Format:** Provide only the raw `it(...)` blocks, ready to be pasted inside the `describe` block.

**Why it's better:** The persona ("skeptical QA engineer") and the highly specific scenarios guide the LLM to think adversarially, producing much more valuable and non-obvious test cases than a generic request.

**Prompt 2.2: Structured Test Data Generation**

> Generate a JSON object for a complex test scenario. The root object should have two keys: `crates` and `items`.
>
> **Data Constraints:**
> *   `crates`: An array of exactly 2 `Crate` objects. One should be tall and narrow (e.g., `width: 10, depth: 10, height: 100`), the other wide and short (e.g., `width: 100, depth: 100, height: 10`). Both should have a `maxWeight` of `50`.
> *   `items`: An array of 15 `Item` objects. This array must include:
>     *   At least 5 "easy-to-fit" small items.
>     *   3 "tall" items that will only fit in the first crate.
>     *   3 "wide" items that will only fit in the second crate.
>     *   1 item that is dimensionally small but has a `weight` of `60` (should be unplaceable).
>     *   1 item that has dimensions `width: 101, depth: 101, height: 1` (should be unplaceable).
>     *   The remaining items can be of moderate, awkward dimensions.
>
> **Output:** Provide only the JSON object, with no surrounding text.

**Why it's better:** This provides concrete, numeric constraints for the data, ensuring the generated test set is complex, diverse, and guaranteed to test the specific logical branches you care about.

***

### Category 3: Documentation & Explanation (More Specific)

**Prompt 3.1: High-Quality, Actionable README**

> Write a `README.md` file for the `CratePlanner` module.
>
> **Structure and Content:**
> *   **`# CratePlanner`**: Top-level heading.
> *   **`## Overview`**: Explain its purpose in one paragraph. Mention it solves a 3D Bin Packing Problem.
> *   **`## Features`**: A bulleted list including "Handles 3D dimensions and weight constraints," "Supports multiple crates," and "Identifies unplaceable items."
> *   **`## API Reference`**: Detail the class constructor and its public methods (`addItem`, `getPlan`). For each, use a markdown table to describe its parameters and return value.
> *   **`## Usage Example`**: Provide a complete, copy-pasteable TypeScript code block that:
>     1.  Imports `CratePlanner`.
>     2.  Defines an array of initial `Crate` objects.
>     3.  Instantiates `CratePlanner` with the crates.
>     4.  Defines an array of `Item` objects to be added.
>     5.  Loops through the items and calls `addItem` inside a `try...catch` block to handle potential errors.
>     6.  Calls `getPlan()` and logs the final result to the console, showing both the placed and unplaced items.
> *   **`## Limitations`**: Add a section explaining that the current implementation uses a simple heuristic (First-Fit) and does not guarantee the most optimal, space-saving solution.

**Why it's better:** This prompt dictates the exact structure and content of the README, including a fully-formed, practical usage example with error handling, which is far more valuable to a developer than a simple API list.

***

### Category 4: Code Review & Refactoring (More Specific)

**Prompt 4.1: Structured Code Review with Severity**

> I am providing my implementation of the `CratePlanner` class. Act as a principal software engineer performing a formal code review.
>
> **Your Task:**
> Analyze the code for correctness, performance, and style, comparing it against the provided spec. Present your feedback in a markdown table with the following columns:
> *   `Severity`: (`High`, `Medium`, `Low`)
> *   `File & Line Number`: (e.g., `CratePlanner.ts:42`)
> *   `Issue Description`: A concise explanation of the problem.
> *   `Suggested Improvement`: A concrete code snippet or clear instruction for fixing the issue.
>
> **Focus on:**
> *   `High`: Logical bugs that would cause a test to fail or produce incorrect results.
> *   `Medium`: Performance issues (e.g., unnecessary loops) or poor practice (e.g., mutating input).
> *   `Low`: Style nits, typos, or opportunities for slightly cleaner code.
>
> **\[Paste your implementation here]**

**Why it's better:** The structured table format and severity levels transform the LLM's output from a simple text blob into an actionable, professional code review document that is easy to parse and prioritize.

**Prompt 4.2: Targeted Refactoring Proposal**

> Here is my current implementation of the `CratePlanner`. It works, but the placement logic inside `addItem` is becoming complex.
>
> **Your Task:**
> Propose a refactoring to extract the placement logic into a separate "Strategy" pattern.
> 1.  Define a TypeScript `interface` named `PlacementStrategy` with a single method: `findPosition(item: Item, crates: Crate[]): { crateIndex: number } | null`.
> 2.  Create a concrete implementation of this interface called `FirstFitStrategy`.
> 3.  Show the `before` and `after` versions of the `CratePlanner` class, where the `after` version accepts a `PlacementStrategy` in its constructor and uses it in the `addItem` method.
> 4.  Provide a MermaidJS class diagram illustrating the new relationship between `CratePlanner`, `PlacementStrategy`, and `FirstFitStrategy`.

**Why it's better:** Instead of a generic "suggest a refactor," this prompt directs the LLM to implement a specific, well-known design pattern (Strategy). This tests its ability to work with higher-level architectural concepts and provides a much more valuable and educational output.