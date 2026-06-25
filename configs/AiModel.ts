import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("NEXT_PUBLIC_GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey as string);

export const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

export const courseOutlineAIModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig,
});
export const generateNotesAiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    ...generationConfig,
    responseMimeType: "text/plain",
  },
}).startChat({
    history: [
      {
        role: "user",
        parts: [{ text: `generate exam material detail content for each chapter, make sure to include all topic point in the content, make sure to give content in HTML format(Do not add HTMLKL,head, body,title tag), the chapters:
{
"chapter_number": 1,
"chapter_title": "Mastering Advanced Data Structures and Algorithms",
"chapter_summary": "This chapter moves beyond standard data structures, focusing on their efficient implementation and application in complex algorithmic problems. We explore structures optimized for specific query types and learn advanced algorithmic paradigms crucial for competitive programming and system design.",
"topics": [
"Efficient Implementations of Heaps, Segment Trees, and Fenwick Trees (BIT)",
"Disjoint Set Union (DSU) with Path Compression and Union by Rank/Size",
"Tries (Prefix Trees) and Suffix Arrays/Trees for String Algorithms",
"Advanced Graph Algorithms: Network Flow (Max Flow/Min Cut), Strongly Connected Components (Tarjan's/Kosaraju's), Minimum Spanning Trees (Prim's/Kruskal's)",
"Dynamic Programming Optimization: Monotonic Queue/Stack DP, Divide and Conquer Optimization, Bitmask DP",
"Geometric Algorithms: Convex Hull (Graham Scan/Monotone Chain), Line Intersection, Closest Pair of Points"
]
}` }],
      },
      {
        role: "model",
        parts: [{ text: `<div class="chapter">
    <h3>Mastering Advanced Data Structures and Algorithms</h3>
    <h4>Chapter Summary:</h4>
    <p>This chapter moves beyond standard data structures, focusing on their efficient implementation and application in complex algorithmic problems. We explore structures optimized for specific query types and learn advanced algorithmic paradigms crucial for competitive programming and system design.</p>

    <h5>Efficient Implementations of Heaps, Segment Trees, and Fenwick Trees (BIT)</h5>
    <ul>
        <li>
            <strong>Heaps:</strong>
            <ul>
                <li><strong>Review of Binary Heaps:</strong> Min-heap and Max-heap properties, insertion (percolate-up), deletion (percolate-down).</li>
                <li><strong>Heapify:</strong> Building a heap from an array in O(N) time.</li>
                <li><strong>Applications:</strong> Priority queues, heapsort, finding k-th largest/smallest elements.</li>
                <li><strong>Advanced Heap Variants (brief mention):</strong> Binomial heaps, Fibonacci heaps (focus on conceptual understanding rather than deep implementation).</li>
            </ul>
        </li>
        <li>
            <strong>Segment Trees:</strong>
            <ul>
                <li><strong>Concept:</strong> A tree data structure used for storing information about intervals or segments. It allows answering range queries (e.g., sum, min, max) and point/range updates in logarithmic time.</li>
                <li><strong>Construction:</strong> Building the segment tree from an array.</li>
                <li><strong>Range Queries:</strong> How to efficiently query a specific range.</li>
                <li><strong>Point Updates:</strong> How to update a single element and propagate changes up the tree.</li>
                <li><strong>Lazy Propagation (brief):</strong> Concept for optimizing range updates.</li>
                <li><strong>Implementation Details:</strong> Array-based representation, recursive functions for build, query, update.</li>
            </ul>
        </li>
        <li>
            <strong>Fenwick Trees (Binary Indexed Trees - BIT):</strong>
            <ul>
                <li><strong>Concept:</strong> A data structure that can efficiently update elements and calculate prefix sums in a table of numbers. It's often more compact and sometimes faster than segment trees for prefix sum/range sum queries and point updates.</li>
                <li><strong>Operations:</strong>
                    <ul>
                        <li><code>update(index, value)</code>: Adds a value to the element at <code>index</code>.</li>
                        <li><code>query(index)</code>: Returns the prefix sum up to <code>index</code>.</li>
                        <li>Range Sum Query: Can be derived from prefix sums.</li>
                    </ul>
                </li>
                <li><strong>Underlying Principle:</strong> Binary representation and how it maps to tree-like structures implicitly.</li>
                <li><strong>Comparison with Segment Trees:</strong> When to use BIT vs. Segment Tree.</li>
            </ul>
        </li>
    </ul>

    <h5>Disjoint Set Union (DSU) with Path Compression and Union by Rank/Size</h5>
    <ul>
        <li>
            <strong>Concept of DSU (Union-Find):</strong> A data structure that keeps track of a set of elements partitioned into a number of disjoint (non-overlapping) subsets. It supports two primary operations:
            <ul>
                <li><code>find(element)</code>: Determines which subset a particular element belongs to.</li>
                <li><code>union(set1, set2)</code>: Merges two subsets into a single subset.</li>
            </ul>
        </li>
        <li>
            <strong>Basic Implementation:</strong> Array representation where <code>parent[i]</code> stores the parent of element <code>i</code>.
        </li>
        <li>
            <strong>Optimizations:</strong>
            <ul>
                <li><strong>Path Compression:</strong> During a <code>find</code> operation, flatten the structure of the tree by making every node on the path point directly to the root. This significantly speeds up subsequent <code>find</code> operations.</li>
                <li><strong>Union by Rank/Size:</strong> When performing a <code>union</code> operation, attach the shorter/smaller tree under the root of the taller/larger tree. This keeps the trees relatively flat, preventing degenerate cases and maintaining logarithmic height.</li>
            </ul>
        </li>
        <li>
            <strong>Time Complexity:</strong> Amortized almost constant time (inverse Ackermann function) for both <code>find</code> and <code>union</code> with both optimizations.
        </li>
        <li>
            <strong>Applications:</strong> Kruskal's algorithm for MST, connected components in graphs, cycle detection.
        </li>
    </ul>

    <h5>Tries (Prefix Trees) and Suffix Arrays/Trees for String Algorithms</h5>
    <ul>
        <li>
            <strong>Tries (Prefix Trees):</strong>
            <ul>
                <li><strong>Concept:</strong> A tree-like data structure that stores a dynamic set of strings where the nodes store characters. Each node represents a prefix, and all descendants of a node share that prefix.</li>
                <li><strong>Operations:</strong>
                    <ul>
                        <li>Insertion of a string.</li>
                        <li>Searching for a string.</li>
                        <li>Prefix searching (finding all words with a given prefix).</li>
                    </ul>
                </li>
                <li><strong>Advantages:</strong> Faster lookups in some cases than hash tables, alphabetical ordering of entries, efficient prefix matching.</li>
                <li><strong>Applications:</strong> Autocomplete, spell checkers, IP routing, dictionary search.</li>
            </ul>
        </li>
        <li>
            <strong>Suffix Arrays/Trees (Conceptual Overview):</strong>
            <ul>
                <li><strong>Suffix Array:</strong> A sorted array of all suffixes of a given string. It allows for fast string searching and other string processing tasks.</li>
                <li><strong>Suffix Tree:</strong> A compressed trie of all suffixes of a given string. It's a powerful tool for various string matching problems.</li>
                <li><strong>Applications:</strong> Pattern matching, finding longest common substrings, bioinformatics (DNA sequence analysis).</li>
                <li><strong>Complexity (brief):</strong> Construction can be complex (e.g., O(N log N) for suffix array, O(N) for suffix tree).</li>
            </ul>
        </li>
    </ul>

    <h5>Advanced Graph Algorithms: Network Flow (Max Flow/Min Cut), Strongly Connected Components (Tarjan's/Kosaraju's), Minimum Spanning Trees (Prim's/Kruskal's)</h5>
    <ul>
        <li>
            <strong>Network Flow (Max Flow/Min Cut):</strong>
            <ul>
                <li><strong>Flow Network:</strong> Directed graph with capacities on edges, source, and sink nodes.</li>
                <li><strong>Flow:</strong> Amount of "material" passing through edges, respecting capacity constraints.</li>
                <li><strong>Max Flow Problem:</strong> Find the maximum possible flow from a source to a sink.</li>
                <li><strong>Ford-Fulkerson Algorithm (and Edmonds-Karp):</strong> Augmenting paths using BFS to find paths in the residual graph.</li>
                <li><strong>Max Flow Min Cut Theorem:</strong> The maximum amount of flow through a network is equal to the capacity of a minimum cut.</li>
                <li><strong>Applications:</strong> Bipartite matching, project selection, transportation problems.</li>
            </ul>
        </li>
        <li>
            <strong>Strongly Connected Components (SCCs):</strong>
            <ul>
                <li><strong>Concept:</strong> A maximal subgraph of a directed graph such that for every pair of vertices (u, v) in the subgraph, there is a path from u to v and a path from v to u.</li>
                <li><strong>Tarjan's Algorithm:</strong> A single DFS-based algorithm using discovery times and low-link values.</li>
                <li><strong>Kosaraju's Algorithm:</strong> Two DFS passes; first on the graph, second on its transpose.</li>
                <li><strong>Applications:</strong> Analyzing dependencies, cycle detection in directed graphs, simplifying graph representations.</li>
            </ul>
        </li>
        <li>
            <strong>Minimum Spanning Trees (MST) - Review and Deeper Dive:</strong>
            <ul>
                <li><strong>Concept:</strong> A subgraph of an undirected, connected, edge-weighted graph that connects all the vertices together, without any cycles, and with the minimum possible total edge weight.</li>
                <li><strong>Prim's Algorithm:</strong>
                    <ul>
                        <li><strong>Approach:</strong> Starts from an arbitrary vertex and grows the MST by iteratively adding the cheapest edge that connects a vertex in the MST to a vertex outside the MST.</li>
                        <li><strong>Implementation:</strong> Using a min-priority queue.</li>
                        <li><strong>Time Complexity:</strong> O(E log V) or O(E + V log V) with Fibonacci heap.</li>
                    </ul>
                </li>
                <li><strong>Kruskal's Algorithm:</strong>
                    <ul>
                        <li><strong>Approach:</strong> Sorts all edges by weight in non-decreasing order and adds them to the MST if they don't form a cycle with already added edges (uses DSU for cycle detection).</li>
                        <li><strong>Implementation:</strong> Sorting and DSU.</li>
                        <li><strong>Time Complexity:</strong> O(E log E) or O(E log V).</li>
                    </ul>
                </li>
                <li><strong>Applications:</strong> Network design, cluster analysis.</li>
            </ul>
        </li>
    </ul>

    <h5>Dynamic Programming Optimization: Monotonic Queue/Stack DP, Divide and Conquer Optimization, Bitmask DP</h5>
    <ul>
        <li>
            <strong>Monotonic Queue/Stack DP:</strong>
            <ul>
                <li><strong>Concept:</strong> Used to optimize DP states where the transition involves finding minimum/maximum over a sliding window or a range, and the "best" previous state maintains a monotonic property.</li>
                <li><strong>Monotonic Queue:</strong> A deque that stores indices of candidate states, maintaining elements in increasing or decreasing order.</li>
                <li><strong>Applications:</strong> Sliding window minimum/maximum, finding the largest rectangle in a histogram, some optimal resource allocation problems.</li>
            </ul>
        </li>
        <li>
            <strong>Divide and Conquer Optimization (Knuth's Optimization/Convex Hull Trick - brief):</strong>
            <ul>
                <li><strong>Concept:</strong> Applies to DP problems of the form <code>dp[i][j] = min/max (dp[i-1][k] + cost(k, j))</code>, where the optimal split point <code>k</code> has a monotonic property.</li>
                <li><strong>Knuth's Optimization:</strong> When the cost function satisfies certain quadrangle inequality properties, the optimal split point <code>k</code> for <code>dp[i][j]</code> is monotonic with <code>j</code>.</li>
                <li><strong>Convex Hull Trick (brief):</strong> Used when the transition functions are linear and have a specific structure, allowing queries on a set of lines to find the minimum/maximum intersection.</li>
                <li><strong>Applications:</strong> Optimal matrix chain multiplication variations, certain interval partitioning problems.</li>
            </ul>
        </li>
        <li>
            <strong>Bitmask DP:</strong>
            <ul>
                <li><strong>Concept:</strong> Used when the state of the DP depends on a subset of items, usually for problems with a small number of items (typically up to 20-22). A bitmask (an integer) represents the subset.</li>
                <li><strong>State Representation:</strong> Each bit in the mask corresponds to the presence or absence of an item.</li>
                <li><strong>Transitions:</strong> Iterating through subsets and modifying the mask.</li>
                <li><strong>Applications:</strong> Traveling Salesperson Problem (TSP), assignment problems, Hamiltonian paths, problems involving subsets of items.</li>
            </ul>
        </li>
    </ul>

    <h5>Geometric Algorithms: Convex Hull (Graham Scan/Monotone Chain), Line Intersection, Closest Pair of Points</h5>
    <ul>
        <li>
            <strong>Convex Hull:</strong>
            <ul>
                <li><strong>Concept:</strong> The smallest convex polygon that contains a given set of points.</li>
                <li><strong>Graham Scan:</strong>
                    <ul>
                        <li><strong>Approach:</strong> Sorts points by polar angle around a lowest-rightmost point. Uses a stack to build the hull, removing points that create non-left turns.</li>
                        <li><strong>Time Complexity:</strong> O(N log N) due to sorting.</li>
                    </ul>
                </li>
                <li><strong>Monotone Chain (Andrew's Algorithm):</strong>
                    <ul>
                        <li><strong>Approach:</strong> Sorts points by x-coordinate (then y). Builds upper hull and lower hull separately using a stack.</li>
                        <li><strong>Time Complexity:</strong> O(N log N) due to sorting.</li>
                    </ul>
                </li>
                <li><strong>Applications:</strong> Pattern recognition, image processing, collision detection.</li>
            </ul>
        </li>
        <li>
            <strong>Line Intersection:</strong>
            <ul>
                <li><strong>Concept:</strong> Determining if two line segments intersect and, if so, finding the intersection point.</li>
                <li><strong>Techniques:</strong>
                    <ul>
                        <li><strong>Orientation Test (Cross Product):</strong> Using cross product to determine if points are collinear, or if a point lies to the left/right of a directed line.</li>
                        <li><strong>Bounding Box Check:</strong> A quick preliminary check to see if the bounding boxes of the segments overlap.</li>
                        <li><strong>Parametric Equations (for intersection point):</strong> Solving equations if segments are not parallel.</li>
                    </ul>
                </li>
                <li><strong>Special Cases:</strong> Parallel lines, collinear segments, endpoints touching.</li>
                <li><strong>Applications:</strong> Computer graphics, CAD, geographical information systems.</li>
            </ul>
        </li>
        <li>
            <strong>Closest Pair of Points:</strong>
            <ul>
                <li><strong>Concept:</strong> Given a set of N points in a 2D plane, find the two points that are closest to each other.</li>
                <li><strong>Brute Force:</strong> O(N^2) complexity.</li>
                <li><strong>Divide and Conquer Algorithm:</strong>
                    <ul>
                        <li><strong>Approach:</strong> Sort points by x-coordinate. Divide the set into two halves. Recursively find closest pairs in each half. The critical part is handling pairs where one point is in each half, focusing on a narrow "strip" around the dividing line.</li>
                        <li><strong>Time Complexity:</strong> O(N log N).</li>
                    </ul>
                </li>
                <li><strong>Applications:</strong> Air traffic control, pattern recognition.</li>
            </ul>
        </li>
    </ul>
</div>` }],
      },
    ],
  });

export const courseMaterialAIModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig,
});

export const courseSummaryAIModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig,
});

export const generateStudyTypeContentAiModel = genAI
  .getGenerativeModel({
    model: "gemini-2.5-flash",
  })
  .startChat({
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },

    history: [
      {
        role: "user",
        parts: [
          {
            text: `Generate 10 flashcards on the topic Flutter Fundamentals.
Return ONLY valid JSON in this format:

[
  {
    "front": "Question",
    "back": "Answer"
  }
]

Do not include markdown, explanations, or code fences.`,
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: `[
  {
    "front": "What is a Widget in Flutter?",
    "back": "A Widget is the basic building block of a Flutter application's user interface."
  },
  {
    "front": "What are Stateless Widgets?",
    "back": "Widgets whose state cannot change after they are created."
  },
  {
    "front": "What are Stateful Widgets?",
    "back": "Widgets that can rebuild when their internal state changes."
  }
]`,
          },
        ],
      },
    ],
  });