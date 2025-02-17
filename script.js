// Clase Token
class Token {
    constructor(tipo, valor) {
      this.tipo = tipo;
      this.valor = valor;
    }
  }
  
  // Lexer: Convierte la entrada en tokens
  function lexer(input) {
    const tokens = [];
    let current = 0;
    const variableRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  
    while (current < input.length) {
      let char = input[current];
  
      if (/\s/.test(char)) {
        current++;
        continue;
      }
  
      // Identificadores (variables)
      if (/[a-zA-Z_]/.test(char)) {
        let varName = "";
        while (current < input.length && /[a-zA-Z0-9_]/.test(input[current])) {
          varName += input[current];
          current++;
        }
        tokens.push(new Token("IDENTIFICADOR", varName));
        continue;
      }
  
      // Números (enteros o decimales)
      if (/\d/.test(char)) {
        let numStr = "";
        while (current < input.length && /[\d\.]/.test(input[current])) {
          numStr += input[current];
          current++;
        }
        if (numStr.split('.').length > 2) {
          throw new Error("Número mal formado.");
        }
        tokens.push(new Token("NUMERO", parseFloat(numStr)));
        continue;
      }
  
      // Operadores y símbolos
      const singleCharTokens = {
        "+": "SUMA",
        "-": "RESTA",
        "*": "MULTIPLICACION",
        "/": "DIVISION",
        "(": "PAREN_ABRE",
        ")": "PAREN_CIERRA",
        "=": "IGUAL",
        ";": "PUNTO_Y_COMA" 
      };
  
      if (singleCharTokens[char]) {
        tokens.push(new Token(singleCharTokens[char], char));
        current++;
        continue;
      }
  
      throw new Error("Carácter no reconocido: " + char);
    }
  
    tokens.push(new Token("EOF", null));
    return tokens;
  }
  
  // Nodo del AST
  class ASTNode {
    constructor(tipo, valor = null, izq = null, der = null) {
      this.tipo = tipo;
      this.valor = valor;
      this.izq = izq;
      this.der = der;
    }
  }
  
  // Parser: Genera el AST
  class Parser {
    constructor(tokens) {
      this.tokens = tokens;
      this.pos = 0;
      this.currentToken = this.tokens[this.pos];
    }
  
    eat(tipo) {
      if (this.currentToken.tipo === tipo) {
        this.pos++;
        this.currentToken = this.tokens[this.pos];
      } else {
        throw new Error(`Error de sintaxis: se esperaba ${tipo}, pero se encontró ${this.currentToken.tipo}`);
      }
    }
  
    factor() {
      let token = this.currentToken;
      if (token.tipo === "NUMERO") {
        this.eat("NUMERO");
        return new ASTNode("NUMERO", token.valor);
      } else if (token.tipo === "IDENTIFICADOR") {
        this.eat("IDENTIFICADOR");
        return new ASTNode("VARIABLE", token.valor);
      } else if (token.tipo === "PAREN_ABRE") {
        this.eat("PAREN_ABRE");
        let result = this.expr();
        this.eat("PAREN_CIERRA");
        return result;
      }
      throw new Error("Error de sintaxis en factor.");
    }
  
    term() {
      let node = this.factor();
      while (this.currentToken.tipo === "MULTIPLICACION" || this.currentToken.tipo === "DIVISION") {
        let token = this.currentToken;
        this.eat(token.tipo);
        node = new ASTNode(token.tipo, token.valor, node, this.factor());
      }
      return node;
    }
  
    expr() {
      let node = this.term();
      while (this.currentToken.tipo === "SUMA" || this.currentToken.tipo === "RESTA") {
        let token = this.currentToken;
        this.eat(token.tipo);
        node = new ASTNode(token.tipo, token.valor, node, this.term());
      }
      return node;
    }
  
    assignment() {
      if (this.currentToken.tipo === "IDENTIFICADOR") {
        let varName = this.currentToken.valor;
        this.eat("IDENTIFICADOR");
        this.eat("IGUAL");
        let exprNode = this.expr();
        this.eat("PUNTO_Y_COMA");   
        return new ASTNode("ASIGNACION", varName, exprNode);
      }
      return this.expr();
    }
  
    parse() {
      let result = this.assignment();
      if (this.currentToken.tipo !== "EOF") {
        throw new Error("Error de sintaxis: tokens adicionales encontrados.");
      }
      return result;
    }
  }
  
  // Evaluador de AST
  class Evaluator {
    constructor() {
      this.variables = {};
    }
  
    eval(node) {
      if (node.tipo === "NUMERO") {
        return node.valor;
      }
      if (node.tipo === "VARIABLE") {
        if (!(node.valor in this.variables)) {
          throw new Error(`Error: variable "${node.valor}" no definida.`);
        }
        return this.variables[node.valor];
      }
      if (node.tipo === "ASIGNACION") {
        let value = this.eval(node.izq);
        this.variables[node.valor] = value;
        return value;
      }
  
      let izq = this.eval(node.izq);
      let der = this.eval(node.der);
  
      switch (node.tipo) {
        case "SUMA": return izq + der;
        case "RESTA": return izq - der;
        case "MULTIPLICACION": return izq * der;
        case "DIVISION":
          if (der === 0) throw new Error("Error: División por cero.");
          return izq / der;
      }
    }
  }
  
  function analizar() {
    const input = document.getElementById("inputExpression").value;
    const resultDiv = document.getElementById("result");
    try {
      const tokens = lexer(input);
      const parser = new Parser(tokens);
      const ast = parser.parse();
      const evaluator = new Evaluator();
      const resultado = evaluator.eval(ast);
      resultDiv.innerHTML = `<p>Resultado: <strong>${resultado}</strong></p>`;
    } catch (error) {
      resultDiv.innerHTML = `<p style="color:red;">${error.message}</p>`;
    }
  }
  
