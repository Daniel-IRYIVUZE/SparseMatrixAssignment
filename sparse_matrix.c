#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Structure to represent a non-zero element in the sparse matrix
typedef struct {
    int row;
    int col;
    int value;
} Element;

// Structure to represent the sparse matrix
typedef struct {
    int numRows;
    int numCols;
    int numElements;
    Element* elements;
} SparseMatrix;

// Function to read a sparse matrix from a string
SparseMatrix* readSparseMatrixFromString(const char* matrixString) {
    SparseMatrix* matrix = (SparseMatrix*)malloc(sizeof(SparseMatrix));
    if (matrix == NULL) {
        perror("Error allocating memory");
        exit(EXIT_FAILURE);
    }

    char* line = strtok((char*)matrixString, "\n");
    sscanf(line, "rows=%d", &matrix->numRows);
    line = strtok(NULL, "\n");
    sscanf(line, "cols=%d", &matrix->numCols);

    matrix->numElements = 0;
    matrix->elements = NULL;

    int capacity = 10;
    matrix->elements = (Element*)malloc(capacity * sizeof(Element));
    if (matrix->elements == NULL) {
        perror("Error allocating memory");
        exit(EXIT_FAILURE);
    }

    while ((line = strtok(NULL, "\n")) != NULL) {
        int row, col, value;
        sscanf(line, "(%d, %d, %d)", &row, &col, &value);
        if (matrix->numElements >= capacity) {
            capacity *= 2;
            matrix->elements = (Element*)realloc(matrix->elements, capacity * sizeof(Element));
            if (matrix->elements == NULL) {
                perror("Error reallocating memory");
                exit(EXIT_FAILURE);
            }
        }
        matrix->elements[matrix->numElements].row = row;
        matrix->elements[matrix->numElements].col = col;
        matrix->elements[matrix->numElements].value = value;
        matrix->numElements++;
    }

    return matrix;
}

// Function to print a sparse matrix
void printSparseMatrix(SparseMatrix* matrix) {
    printf("Rows: %d, Columns: %d\n", matrix->numRows, matrix->numCols);
    for (int i = 0; i < matrix->numElements; i++) {
        printf("(%d, %d, %d)\n",
            matrix->elements[i].row,
            matrix->elements[i].col,
            matrix->elements[i].value);
    }
}

// Function to add two sparse matrices
SparseMatrix* addSparseMatrices(SparseMatrix* A, SparseMatrix* B) {
    if (A->numRows != B->numRows || A->numCols != B->numCols) {
        fprintf(stderr, "Matrices dimensions do not match for addition\n");
        exit(EXIT_FAILURE);
    }

    SparseMatrix* C = (SparseMatrix*)malloc(sizeof(SparseMatrix));
    C->numRows = A->numRows;
    C->numCols = A->numCols;
    C->numElements = 0;
    int capacity = A->numElements + B->numElements;
    C->elements = (Element*)malloc(capacity * sizeof(Element));

    int i = 0, j = 0;
    while (i < A->numElements && j < B->numElements) {
        if (A->elements[i].row < B->elements[j].row || 
            (A->elements[i].row == B->elements[j].row && A->elements[i].col < B->elements[j].col)) {
            C->elements[C->numElements++] = A->elements[i++];
        } else if (A->elements[i].row > B->elements[j].row || 
            (A->elements[i].row == B->elements[j].row && A->elements[i].col > B->elements[j].col)) {
            C->elements[C->numElements++] = B->elements[j++];
        } else {
            int sum = A->elements[i].value + B->elements[j].value;
            if (sum != 0) {
                C->elements[C->numElements].row = A->elements[i].row;
                C->elements[C->numElements].col = A->elements[i].col;
                C->elements[C->numElements++].value = sum;
            }
            i++;
            j++;
        }
    }

    while (i < A->numElements) {
        C->elements[C->numElements++] = A->elements[i++];
    }

    while (j < B->numElements) {
        C->elements[C->numElements++] = B->elements[j++];
    }

    return C;
}

// Function to subtract matrix B from matrix A
SparseMatrix* subtractSparseMatrices(SparseMatrix* A, SparseMatrix* B) {
    for (int i = 0; i < B->numElements; i++) {
        B->elements[i].value = -B->elements[i].value;
    }
    return addSparseMatrices(A, B);
}

// Function to multiply two sparse matrices
SparseMatrix* multiplySparseMatrices(SparseMatrix* A, SparseMatrix* B) {
    if (A->numCols != B->numRows) {
        fprintf(stderr, "Matrices dimensions do not match for multiplication\n");
        exit(EXIT_FAILURE);
    }

    SparseMatrix* C = (SparseMatrix*)malloc(sizeof(SparseMatrix));
    C->numRows = A->numRows;
    C->numCols = B->numCols;
    C->numElements = 0;
    int capacity = A->numElements * B->numElements;
    C->elements = (Element*)malloc(capacity * sizeof(Element));

    for (int i = 0; i < A->numElements; i++) {
        for (int j = 0; j < B->numElements; j++) {
            if (A->elements[i].col == B->elements[j].row) {
                int row = A->elements[i].row;
                int col = B->elements[j].col;
                int value = A->elements[i].value * B->elements[j].value;

                int found = 0;
                for (int k = 0; k < C->numElements; k++) {
                    if (C->elements[k].row == row && C->elements[k].col == col) {
                        C->elements[k].value += value;
                        found = 1;
                        break;
                    }
                }

                if (!found) {
                    C->elements[C->numElements].row = row;
                    C->elements[C->numElements].col = col;
                    C->elements[C->numElements++].value = value;
                }
            }
        }
    }

    return C;
}

// Main function to test the implementation
int main() {
    // Input strings for matrixA.txt and matrixB.txt
    const char* matrixAString = "rows=3\ncols=3\n(0, 0, 1)\n(1, 1, 2)\n(2, 2, 3)";
    const char* matrixBString = "rows=3
