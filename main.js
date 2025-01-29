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
   * @param {string} key - unique identifier of new node
   * @param {NodeMetadata} - metadata of new node
   */
  addNode(key, metadata) {
    this.nodes.set(key, metadata);
    this.edges.set(key, new Map());
  }

  /**
   * Function addEdge add a new egde from start to end
   * @param {string} start - identifier of start node
   * @param {string} end - identifier of end node
   * @param {number} weight - weight of edge
   * @throws {Error} if either node does not exist
   */
  addEdge(start, end, weight) {
    if (!this.#nodeExist(start) || !this.#nodeExist(end)) return;
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
    if (!this.#nodeExist(start) || !this.#nodeExist(end)) return;

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
   * @param {string} key - identifier of node
   */
  deleteNode(key) {
    if (!this.#nodeExist(key)) return;

    if (this.edges.has(key)) {
      this.edges
        .get(key)
        .forEach((_, neighbor) => this.edges.get(neighbor)?.delete(key));
      this.edges.delete(key);
    }
    this.nodes.delete(key);
  }

  /**
   * Function verifyNodeExistence checks a given node exists in the graph
   * @param {string} key - identifier of node
   * @returns {boolean} indicates whether a node exists or not
   */
  #nodeExist(key) {
    return this.nodes.has(key);
  }
}

const g = new WeightedGraph();

const canvas = document.getElementById("graph");

/**
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext("2d");

let hoveredCell = null;
let shortestPath = null;
const selectedNodes = new Set();
let zoom = 1;
let gridSize = 20;
let cheapestPath = [];

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

  const drawnEdges = new Set();
  g.edges.forEach((edges, node) => {
    const curNode = g.nodes.get(node);
    edges.forEach((weight, neighbor) => {
      const edgeKey1 = `${node}-${neighbor}`;
      const edgeKey2 = `${neighbor}-${node}`;

      if (!drawnEdges.has(edgeKey1) && !drawnEdges.has(edgeKey2)) {
        const nnode = g.nodes.get(neighbor);

        if (cheapestPath.includes(node) && cheapestPath.includes(neighbor)) {
          ctx.strokeStyle = "#5050ff";
        } else {
          ctx.strokeStyle = "#000";
        }

        ctx.beginPath();
        ctx.moveTo(
          curNode.x * gridSize + gridSize / 2,
          curNode.y * gridSize + gridSize / 2,
        );
        ctx.lineTo(
          nnode.x * gridSize + gridSize / 2,
          nnode.y * gridSize + gridSize / 2,
        );
        ctx.stroke();
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const midX = ((curNode.x + nnode.x) / 2) * gridSize + gridSize / 2 - 10;
        const midY = ((curNode.y + nnode.y) / 2) * gridSize + gridSize / 2 - 15;
        ctx.fillText(weight, midX, midY);
        drawnEdges.add(edgeKey1);
        drawnEdges.add(edgeKey2);
      }
    });
  });

  if (hoveredCell) {
    const { x, y } = hoveredCell;
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
  }

  selectedNodes.forEach((key) => {
    const node = g.nodes.get(key);
    ctx.fillStyle = "rgba(255, 80, 255, 1)";
    ctx.fillRect(node.x * gridSize, node.y * gridSize, gridSize, gridSize);
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(key, node.x * gridSize, node.y * gridSize - 6);
  });

  g.nodes.forEach((cell, key) => {
    if (!selectedNodes.has(key)) {
      const { x, y, isReadyForPickup } = cell;

      if (cheapestPath.includes(key)) {
        ctx.fillStyle = "rgba(80, 80, 255, 1)";
      } else {
        ctx.fillStyle = "rgba(255, 80, 80, 1)";
      }

      ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(key, x * gridSize, y * gridSize - 6);

      if (isReadyForPickup) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(80, 255, 80, 1)";
        ctx.arc(
          x * gridSize + gridSize / 2,
          y * gridSize + gridSize / 2,
          gridSize / 4,
          0,
          2 * Math.PI,
        );
        ctx.fill();
        ctx.stroke();
      }
    }
  });
}

/**
 * Function getCellFromMouse converts mouse coordinates to grid cell coordinates.
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
 * "X" - clear graph
 * "esc" - clear selection
 * "d" - delete selected nodes
 * "e" - draw an edge between two nodes
 * @param {KeyboardEvent} event - the keyboard event
 */
function handleKeyUpEvent(event) {
  const { key } = event;

  console.log(key);
  switch (key) {
    case "X":
      g.nodes.clear();
      g.edges.clear();
      break;
    case "Escape":
      cheapestPath = [];
      break;
    case "d":
      selectedNodes.forEach((ID) => {
        if (g.nodes.has(ID)) {
          g.deleteNode(ID);
          selectedNodes.delete(ID);
        }
      });
      break;
    case "e":
      if (selectedNodes.size != 2) {
        alert("Only two selected nodes allowed when drawing edges");
        return;
      }
      const [start, end] = Array.from(selectedNodes);
      const startNode = g.nodes.get(start);
      const endNode = g.nodes.get(end);
      const weight = calculateWeight(startNode, endNode);

      g.addEdge(start, end, weight);
      break;
    case "p":
      if (selectedNodes.size != 2) {
        alert("Only two selected nodes allowed when finding cheapest path");
        return;
      }
      const [startC, endC] = Array.from(selectedNodes);
      cheapestPath = g.findCheapestPath(startC, endC);
      break;
  }

  selectedNodes.clear();
  drawGrid();
}

/**
 * Function calculateWeight calculates the weight of an edge using pythagoras formula and floors the result
 * @param {NodeMetadata} start - metadata of starting node
 * @param {NodeMetadata} end - metadata of ending node
 * @returns {number} weight of edge
 */
function calculateWeight(start, end) {
  const a = Math.abs(start.x - end.x);
  const b = Math.abs(start.y - end.y);
  return Math.floor(Math.sqrt(a * a + b * b));
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keyup", handleKeyUpEvent);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("click", handleMouseClick);
resizeCanvas();
