/**
 * @typedef NodeMetadata
 * @property {boolean} isReadyForPickup - describes if a node has a car ready for pick up
 * @property {number} x - x coordinate of node
 * @property {number} y - y coordinate of node
 */

/**
 * Class WeightedGraph represents a graph of nodes with weighted edges
 */
class WeightedGraph {
  constructor() {
    /**
     * @type {Map<string,NodeMetadata>}
     */
    this.nodes = new Map();
    /**
     * @type {Map<string,Map<string,number>>}
     */
    this.edges = new Map();
  }

  /**
   * Function addNode adds a new node to the graph and initializes a new map for its edges
   * @param {string} ID - unique identifier of new node
   * @param {NodeMetadata} [metadata={}] - metadata of new node
   */
  addNode(ID, metadata) {
    this.nodes.set(ID, metadata);
    this.edges.set(ID, new Map());
  }

  /**
   * Function addEdge add a new egde from start to end
   * @param {string} start - identifier of start node
   * @param {string} end - identifier of end node
   * @param {number} weight - weight of edge
   * @throws {Error} if either node does not exist
   */
  addEdge(start, end, weight) {
    if (!this.#nodeExist(start) || !this.#nodeExist(end)) {
      throw new Error(
        "Both nodes must exist before adding an edge between them",
      );
    }
    this.edges.get(start).set(end, weight);
    this.edges.get(end).set(start, weight);
  }

  /**
   * Function findShortestPath finds the cheapest path between two nodes
   * @param {string} start - identifier of start node
   * @param {string} end - identifier of end node
   * @throws {Error} if either node does not exist
   * @return {string[]} an array describing the cheapest path bewteen two nodes
   */
  findCheapestPath(start, end) {
    if (!this.#nodeExist(start) || !this.#nodeExist(end)) {
      throw new Error("Both nodes must exist before finding cheapest path");
    }

    const previous = new Map();
    const unvisited = new Set(this.nodes.keys());
    const distances = new Map([...this.nodes].map(([k]) => [k, Infinity]));
    distances.set(start, 0);

    while (unvisited.size > 0) {
      const curNode = Array.from(unvisited).reduce((minNode, node) =>
        distances.get(node) < distances.get(minNode) ? node : minNode,
      );
      if (curNode === end) break;
      this.edges.get(curNode).forEach((weight, neighbor) => {
        if (unvisited.has(neighbor)) {
          const newDistance = distances.get(curNode) + weight;
          if (distances.get(neighbor) > newDistance) {
            distances.set(neighbor, newDistance);
            previous.set(neighbor, curNode);
          }
        }
      });
      unvisited.delete(curNode);
    }

    const path = [];
    for (let at = end; at != null; at = previous.get(at)) {
      path.push(at);
    }

    return path.reverse();
  }

  /**
   * Function deleteNode deletes a node by ID and its connecting edges
   * @param {string} ID - identifier of node
   */
  deleteNode(ID) {
    this.nodes.delete(ID);
    this.edges.delete(ID);
  }

  /**
   * Function verifyNodeExistence checks a given node exists in the graph
   * @param {string} ID - identifier of node
   * @returns {boolean} indicates whether a node exists or not
   */
  #nodeExist(ID) {
    return this.nodes.has(ID);
  }
}

const g = new WeightedGraph();

const canvas = document.getElementById("graph");

/**
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext("2d");

let hoveredCell = null;
const selectedNodes = new Set();
const gridSize = 20;

/**
 * Function resizeCanvas resizes the canvas to fill the entire window and redraws the grid
 * this function is called both on initial load and whenever the window is resized
 */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawGrid();
}

/**
 * Function drawGrid draws a grid on the canvas
 */
function drawGrid() {
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "#ccc";

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (hoveredCell) {
    const { x, y } = hoveredCell;
    ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
  }

  selectedNodes.forEach((ID) => {
    const node = g.nodes.get(ID);
    ctx.fillStyle = "rgba(60, 179, 133, 0.5)";
    ctx.fillRect(node.x * gridSize, node.y * gridSize, gridSize, gridSize);
  });

  g.nodes.forEach((cell, key) => {
    if (!selectedNodes.has(key)) {
      const { x, y } = cell;
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
      ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
    }
  });

  g.edges.forEach((edges, node) => {
    const curNode = g.nodes.get(node);
    edges.forEach((_, neighbor) => {
      const nnode = g.nodes.get(neighbor);
      ctx.beginPath();
      ctx.moveTo(curNode.x, curNode.y);
      ctx.lineTo(nnode.x, nnode.y);
      ctx.stroke();
    });
  });
}

/**
 * Converts mouse coordinates to grid cell coordinates.
 * @param {number} mouseX - the mouse X position.
 * @param {number} mouseY - the mouse Y position.
 * @returns {Object} - the grid cell coordinates { x, y }.
 */
function getCellFromMouse(mouseX, mouseY) {
  const x = Math.floor(mouseX / gridSize);
  const y = Math.floor(mouseY / gridSize);
  return { x, y };
}

/**
 * Function handleMouseMove handles the mouse move event to highlight the hovered cell.
 * @param {MouseEvent} event - the mouse event.
 */
function handleMouseMove(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const cell = getCellFromMouse(mouseX, mouseY);
  const cellKey = `${cell.x},${cell.y}`;

  if (!hoveredCell || hoveredCell.x !== cell.x || hoveredCell.y !== cell.y) {
    hoveredCell = { key: cellKey, ...cell };
    drawGrid();
  }
}

/**
 * Function handleMouseClick handles the mouse click event to mark a cell as clicked.
 * @param {MouseEvent} event - the mouse event.
 */
function handleMouseClick(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const cell = getCellFromMouse(mouseX, mouseY);
  const cellKey = `${cell.x},${cell.y}`;

  if (g.nodes.has(cellKey)) {
    selectedNodes.add(cellKey);
  } else {
    selectedNodes.clear();
    g.addNode(cellKey, {
      x: cell.x,
      y: cell.y,
      isReadyForPickup: true,
    });
  }

  drawGrid();
}

/**
 * Function handleKeyUpEvent handles the keyboard event when a keymap is pressed
 *
 * available keymaps:
 * "esc" - Clear graph
 * "d" - delete selected nodes
 * "e" - draw an edge between two nodes
 * @param {KeyboardEvent} event - the keyboard event
 */
function handleKeyUpEvent(event) {
  const { key } = event;

  console.log(key);
  switch (key) {
    case "Escape":
      g.nodes.clear();
      g.edges.clear();
      selectedNodes.clear();
    case "d":
      selectedNodes.forEach((ID) => {
        if (g.nodes.has(ID)) {
          g.deleteNode(ID);
          selectedNodes.delete(ID);
        }
      });
    case "e":
      if (selectedNodes.size != 2) {
        alert("Only two selected nodes allowed when drawing edges");
        return;
      }
      const [n1, n2] = Array.from(selectedNodes);
      g.addEdge(n1, n2);
  }

  drawGrid();
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keyup", handleKeyUpEvent);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("click", handleMouseClick);
resizeCanvas();
