---
timestamp: 'Sat Oct 18 2025 14:55:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251018_145522.6da25d5d.md]]'
content_id: ae13bdf7225d841a44a3133863978e2085a31fbc54f0682983554dcd8de73f92
---

# response:

Excellent question! Using a specification file (like a `.spec` test file) as the foundation for your prompts is a highly effective technique. It provides the LLM with crucial context, constraints, and a "source of truth" for the desired behavior.

Based on the concept of a `CratePlanner` as defined in a spec file, we can infer its purpose: to efficiently and correctly place items of varying dimensions and weights into a set of crates with specific capacity constraints.

Here are several categories of good prompts you can use, ranging from code generation to documentation and analysis.

***

### Foundational Step: The Context-Setting Prompt

Before any specific task, start your conversation with the LLM by providing the full context. This is the most critical step.

**Master Prompt Template:**

```
You are an expert TypeScript/JavaScript developer specializing in logistics algorithms and writing clean, maintainable, and well-tested code.

I am going to provide you with the content of a Jest/Jasmine specification file, `CratePlanner.spec.ts`. This file defines the required behavior, interfaces, and public API for a class named `CratePlanner`. This spec is the single source of truth. All code, documentation, and analysis you generate must strictly adhere to the tests and interfaces defined within it.

Here is the content of `CratePlanner.spec.ts`:

```

// \[ PASTE THE ENTIRE CONTENT OF YOUR CratePlanner.spec FILE HERE ]

```

Now, based on the provided specification, please help me with the following tasks.
```

***

### Category 1: Code Generation & Implementation

These prompts ask the LLM to write the actual code based on the "contract" established by the spec file.

**Prompt 1.1: Full Class Implementation**

> Based on the spec, write the complete implementation for the `CratePlanner` class in TypeScript. Ensure the implementation is efficient and passes all the described tests. Add comments to explain the core logic of the packing algorithm you choose.

**Prompt 1.2: Implementing a Specific Method**

> Looking at the spec, focus on the tests related to adding a new item. Write just the `addItem()` method for the `CratePlanner` class. It should handle all edge cases described, such as items being too large, too heavy, or when a new crate is needed.

**Prompt 1.3: Generating Helper Types/Interfaces**

> The spec implies the existence of `Item` and `Crate` types. Based on the properties used in the tests (e.g., `width`, `height`, `depth`, `weight`, `maxWeight`), generate the TypeScript `interface` definitions for `Item`, `Crate`, and the final `Plan` that the planner should return.

***

### Category 2: Test Case Expansion

Use the LLM to think of edge cases you might have missed.

**Prompt 2.1: Generating New Edge Cases**

> Analyze the provided `CratePlanner.spec.ts`. What are some critical edge cases that are NOT currently tested? Generate 5 new `it(...)` test blocks in the same style as the existing file. Focus on scenarios like:
>
> * Items with zero dimensions or weight.
> * A list of items where no single item can fit into any crate.
> * The interaction between max weight and max dimensions (e.g., a very light but large item).
> * Perfectly fitting items that leave no remaining space.

**Prompt 2.2: Generating Test Data**

> I need to do more robust testing. Please generate a JSON object containing an array of 20 diverse `Item` objects and an array of 3 `Crate` objects that would represent a complex planning scenario. Include some items that are easy to fit, some that are awkward shapes, and at least two that won't fit at all.

***

### Category 3: Documentation & Explanation

LLMs excel at translating code logic into human-readable text.

**Prompt 3.1: Generating TSDoc / JSDoc Comments**

> Take the `CratePlanner` class implementation (or generate it first if you haven't) and add comprehensive TSDoc comments for the class itself and for all of its public methods. The comments should explain what each method does, its parameters (`@param`), and what it returns (`@returns`), referencing the logic defined in the spec.

**Prompt 3.2: Creating a README / Markdown Documentation**

> Write a `README.md` file for the `CratePlanner` module. It should include the following sections:
>
> * **Overview:** A brief explanation of what the CratePlanner does.
> * **Installation:** A placeholder for installation instructions.
> * **API Reference:** Detail the `CratePlanner` class, its constructor, and public methods based on the spec.
> * **Usage Example:** Provide a clear, simple code example of how to instantiate the planner, add items, and get the final plan.

**Prompt 3.3: Explaining the Logic**

> Explain the core logic of the packing algorithm required to make the tests in `CratePlanner.spec.ts` pass. Describe the problem (it's a variation of the Bin Packing Problem) and outline a step-by-step strategy to solve it. Explain it in a way a junior developer could understand.

***

### Category 4: Code Review & Refactoring

Use the LLM as a partner to improve existing code. (For this, you would provide your implementation along with the spec).

**Prompt 4.1: Critical Code Review**

> I am providing my implementation of the `CratePlanner` class, which is intended to pass the tests in the spec. Please act as a senior developer and perform a thorough code review. Look for:
>
> * Potential bugs or logic errors.
> * Performance bottlenecks in the packing algorithm.
> * Violations of the SOLID principles.
> * Code that is hard to read or maintain.
> * Any deviation from the behavior defined in the spec.
>
> **\[Paste your implementation here]**

**Prompt 4.2: Suggesting Refactors**

> Here is my current implementation of the `CratePlanner`. Based on the spec, suggest a refactoring that would make the code more modular and easier to test. For example, could the placement strategy be extracted into its own function or class? Provide the before-and-after code snippets.
>
> **\[Paste your implementation here]**

***

### Best Practices for Using These Prompts:

1. **Always Start with Context:** Never just ask "write the CratePlanner". Always use the foundational prompt to ground the LLM in the spec file's reality.
2. **Be Specific in Your Request:** Notice how the prompts ask for a specific format (`JSON`, `README.md`, `it(...)` blocks) or a specific role ("act as a senior developer").
3. **Iterate:** If the first output isn't perfect, give it feedback. For example: "That's a good start, but your packing algorithm doesn't account for the `maxWeight` constraint mentioned in the spec. Please revise it."
