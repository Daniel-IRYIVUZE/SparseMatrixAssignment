const fs = require("fs");
const path = require("path");
const readline = require("readline");

class SparseMatrix {
  constructor(numRows = null, numCols = null, matrixFilePath = null) {
    this.numRows = numRows;
    this.numCols = numCols;
    this.elements = {};

    if (matrixFilePath) {
      this.loadFromFile(matrixFilePath);
    }
  }

  loadFromFile(filePath) {
    const lines = fs.readFileSync(filePath, "utf-8").split("\n");
    this.numRows = parseInt(lines[0].split("=")[1]);
    this.numCols = parseInt(lines[1].split("=")[1]);

    for (const line of lines.slice(2)) {
      if (line.trim()) {
        if (line[0] !== "(" || line[line.length - 1] !== ")") {
          throw new Error("Input file has wrong format");
        }

        const parts = line.slice(1, -1).split(",");
        if (parts.length !== 3) {
          throw new Error("Input file has wrong format");
        }

        const row = parseInt(parts[0]);
        const col = parseInt(parts[1]);
        const value = parseInt(parts[2]);

        if (isNaN(row) || isNaN(col) || isNaN(value)) {
          throw new Error("Input file has wrong format");
        }

        this.setElement(row, col, value);
      }
    }
  }

  getElement(currRow, currCol) {
    return this.elements[`${currRow},${currCol}`] || 0;
  }

  setElement(currRow, currCol, value) {
    if (value !== 0) {
      this.elements[`${currRow},${currCol}`] = value;
    } else {
      delete this.elements[`${currRow},${currCol}`];
    }
  }

  add(other) {
    if (this.numRows !== other.numRows || this.numCols !== other.numCols) {
      throw new Error("Matrix dimensions must be the same for addition");
    }

    const result = new SparseMatrix(this.numRows, this.numCols);
    for (const key in this.elements) {
      const [row, col] = key.split(",").map(Number);
      result.setElement(
        row,
        col,
        this.elements[key] + other.getElement(row, col)
      );
    }

    for (const key in other.elements) {
      if (!(key in this.elements)) {
        const [row, col] = key.split(",").map(Number);
        result.setElement(row, col, other.elements[key]);
      }
    }

    return result;
  }

  subtract(other) {
    if (this.numRows !== other.numRows || this.numCols !== other.numCols) {
      throw new Error("Matrix dimensions must be the same for subtraction");
    }

    const result = new SparseMatrix(this.numRows, this.numCols);
    for (const key in this.elements) {
      const [row, col] = key.split(",").map(Number);
      result.setElement(
        row,
        col,
        this.elements[key] - other.getElement(row, col)
      );
    }

    for (const key in other.elements) {
      if (!(key in this.elements)) {
        const [row, col] = key.split(",").map(Number);
        result.setElement(row, col, other.elements[key]);
      }
    }

    return result;
  }

  multiply(other) {
    if (this.numCols !== other.numRows) {
      throw new Error("Matrix dimensions are not suitable for multiplication");
    }

    const result = new SparseMatrix(this.numRows, other.numCols);
    for (const key in this.elements) {
      const [row1, col1] = key.split(",").map(Number);
      for (let col2 = 0; col2 < other.numCols; col2++) {
        const value1 = this.elements[key];
        const value2 = other.getElement(col1, col2);
        if (value2 !== 0) {
          result.setElement(
            row1,
            col2,
            result.getElement(row1, col2) + value1 * value2
          );
        }
      }
    }

    return result;
  }

  toFile(filePath) {
    const fileContent = [
      `rows=${this.numRows}`,
      `cols=${this.numCols}`,
      ...Object.entries(this.elements).map(([key, value]) => {
        const [row, col] = key.split(",").map(Number);
        return `(${row}, ${col}, ${value})`;
      }),
    ].join("\n");

    fs.writeFileSync(filePath, fileContent);
  }
}

function promptUser(promptText) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main(matrix1Path, matrix2Path, resultDir) {
  let matrix1, matrix2;

  try {
    matrix1 = new SparseMatrix(null, null, matrix1Path);
    matrix2 = new SparseMatrix(null, null, matrix2Path);
  } catch (e) {
    console.error(`Error loading matrices: ${e}`);
    return;
  }

  while (true) {
    console.log("\nKindly choose an arthmetic operator or exit the program:");
    console.log("1. Addition (+)");
    console.log("2. Subtraction (-)");
    console.log("3. Multiplication (*)");
    console.log("4. Exit\n");

    const operationChoice = await promptUser(
      "Choose one option you want yo use : 1, 2, 3 or 4:\n \n "
    );
    let result, resultPath;

    if (operationChoice === "1") {
      result = matrix1.add(matrix2);
      resultPath = path.join(resultDir, "addition.txt");
      result.toFile(resultPath);
      console.log(`The addition operation results are saved in ${resultPath}`);
    } else if (operationChoice === "2") {
      result = matrix1.subtract(matrix2);
      resultPath = path.join(resultDir, "difference.txt");
      result.toFile(resultPath);
      console.log(
        `The subtraction operation results are saved in ${resultPath}`
      );
    } else if (operationChoice === "3") {
      try {
        result = matrix1.multiply(matrix2);
        resultPath = path.join(resultDir, "multplication.txt");
        result.toFile(resultPath);
        console.log(
          `The multiplication operation results are saved in ${resultPath}`
        );
      } catch (e) {
        console.error(`Error: ${e.message}`);
      }
    } else if (operationChoice === "4") {
      console.log("You exit the program! Thank you");
      break;
    } else {
      console.log("Your choice is invalid, Please try again.");
    }
  }
}

if (process.argv.length !== 5) {
  console.log("You can use this format to run the program: \n");
  console.log(
    "node SparseMatrix.js <matrix1_file_path> <matrix2_file_path> <result_directory>"
  );
  process.exit(1);
}

const matrix1Path = process.argv[2];
const matrix2Path = process.argv[3];
const resultDir = process.argv[4];

if (!fs.existsSync(resultDir) || !fs.lstatSync(resultDir).isDirectory()) {
  console.log(
    `Error: ${resultDir} It is not a directory or It does not exist.`
  );
  process.exit(1);
}

main(matrix1Path, matrix2Path, resultDir);
