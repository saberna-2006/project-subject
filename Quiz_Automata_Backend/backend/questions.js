const bank = {
  FSWD: [
    { id:"f1", question:"Which HTML element is used to create a hyperlink?", options:["<link>","<a>","<href>","<url>"], answer:"<a>" },
    { id:"f2", question:"Which React hook is commonly used to manage state in a functional component?", options:["useEffect","useRef","useState","useMemo"], answer:"useState" },
    { id:"f3", question:"Which Node.js module is commonly used to create an HTTP server?", options:["http","path","fs","events"], answer:"http" },
    { id:"f4", question:"What is the main purpose of Express.js?", options:["Database storage","Web application and API framework","CSS styling","Browser rendering"], answer:"Web application and API framework" },
    { id:"f5", question:"Which MongoDB structure stores a group of documents?", options:["Table","Collection","Row","Schema file"], answer:"Collection" }
  ],
  CN: [
    { id:"c1", question:"How many layers are present in the OSI reference model?", options:["4","5","7","8"], answer:"7" },
    { id:"c2", question:"Which protocol provides reliable, connection-oriented transport?", options:["UDP","IP","TCP","ARP"], answer:"TCP" },
    { id:"c3", question:"Which application-layer protocol translates domain names into IP addresses?", options:["FTP","DNS","SMTP","DHCP"], answer:"DNS" },
    { id:"c4", question:"Which device primarily forwards packets between different networks?", options:["Hub","Repeater","Router","Bridge"], answer:"Router" },
    { id:"c5", question:"Which protocol is commonly used to transfer web pages securely?", options:["HTTP","HTTPS","FTP","Telnet"], answer:"HTTPS" }
  ],
  FLAT: [
    { id:"a1", question:"A finite automaton consists of a finite set of states and a transition function. Which component specifies the starting state?", options:["Final-state set","Initial state","Input alphabet","Transition label"], answer:"Initial state" },
    { id:"a2", question:"Which automaton can have more than one transition for the same state and input symbol?", options:["DFA","NFA","Minimal DFA only","Linear bounded automaton"], answer:"NFA" },
    { id:"a3", question:"Which language class is accepted by finite automata?", options:["Regular languages","Context-sensitive languages only","All recursively enumerable languages","Context-free languages only"], answer:"Regular languages" },
    { id:"a4", question:"In a DFA, for each state and input symbol, how many next states are defined?", options:["Exactly one","Zero or more","At least two","Any finite number"], answer:"Exactly one" },
    { id:"a5", question:"Which notation is commonly used to represent regular languages algebraically?", options:["Regular expression","Parse tree","Turing tape","Production stack"], answer:"Regular expression" }
  ]
};
module.exports = bank;
