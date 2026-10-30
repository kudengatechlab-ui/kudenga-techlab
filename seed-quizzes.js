const db = require('./lib/db');

const quizzes = {
  basics: { title: 'Electronics Basics', level: 'beginner', questions: [
    { q: "What does LED stand for?", options: ["Light Emitting Diode", "Low Energy Device", "Linear Electric Diode", "Light Energy Detector"], answer: 0, explanation: "LED = Light Emitting Diode. It emits light only when current flows in the forward direction." },
    { q: "What unit is electrical resistance measured in?", options: ["Volts", "Amps", "Ohms", "Watts"], answer: 2, explanation: "Resistance is measured in Ohms (Ω). Volts = potential difference, Amps = current, Watts = power." },
    { q: "Which component stores electrical charge?", options: ["Resistor", "Capacitor", "Diode", "Transistor"], answer: 1, explanation: "A capacitor stores energy in an electric field between two plates." },
    { q: "What is the standard operating voltage of an Arduino Uno?", options: ["3.3V", "5V", "9V", "12V"], answer: 1, explanation: "The Arduino Uno runs at 5V on its GPIO pins." },
    { q: "Which law states V = I × R?", options: ["Newton's Law", "Faraday's Law", "Ohm's Law", "Kirchhoff's Law"], answer: 2, explanation: "Ohm's Law links voltage, current, and resistance." }
  ]},
  components: { title: 'Components & Functions', level: 'beginner', questions: [
    { q: "Which component limits current in a circuit?", options: ["Capacitor", "Resistor", "Inductor", "Diode"], answer: 1, explanation: "A resistor limits current by converting electrical energy into heat." },
    { q: "Which component allows current to flow in only one direction?", options: ["Resistor", "Transistor", "Diode", "Capacitor"], answer: 2, explanation: "A diode is a one-way valve for current." },
    { q: "Which sensor detects motion using infrared?", options: ["LDR", "PIR sensor", "Thermistor", "Ultrasonic sensor"], answer: 1, explanation: "PIR = Passive InfraRed. Detects body heat." },
    { q: "Which component can amplify signals?", options: ["Transistor", "Buzzer", "Relay", "LED"], answer: 0, explanation: "A transistor lets a small base current control a larger collector current." },
    { q: "What does a breadboard help you do?", options: ["Solder permanent joints", "Prototype circuits without soldering", "Store components", "Measure voltage"], answer: 1, explanation: "Breadboards let you build and rebuild circuits without soldering." }
  ]},
  electronics: { title: 'Electronics', level: 'intermediate', questions: [
    { q: "Ohm's Law states V = ? × R. What fills the blank?", options: ["I (current)", "P (power)", "E (energy)", "C (capacitance)"], answer: 0, explanation: "V = I × R." },
    { q: "What is the unit of capacitance?", options: ["Farad", "Henry", "Ohm", "Watt"], answer: 0, explanation: "Capacitance is measured in Farads." },
    { q: "Which component stores energy in a magnetic field?", options: ["Capacitor", "Resistor", "Inductor", "Diode"], answer: 2, explanation: "An inductor stores energy in a magnetic field." },
    { q: "A diode allows current to flow in:", options: ["Both directions", "One direction only", "No direction", "Only above 5V"], answer: 1, explanation: "Diodes are one-way valves." },
    { q: "A resistor with bands Red, Red, Brown, Gold is:", options: ["22 Ω", "220 Ω", "2.2 kΩ", "22 kΩ"], answer: 1, explanation: "Red=2, Red=2, Brown=×10 → 220 Ω ±5%." },
    { q: "Two resistors in series have total resistance:", options: ["R1 + R2", "R1 × R2 / (R1 + R2)", "R1 − R2", "Always zero"], answer: 0, explanation: "Series resistances add: R = R1 + R2." },
    { q: "Kirchhoff's Voltage Law states the sum of voltages around a closed loop is:", options: ["0", "1", "The input voltage", "Infinite"], answer: 0, explanation: "KVL: voltages around a closed loop sum to zero." },
    { q: "Why does every LED need a current-limiting resistor?", options: ["For brightness", "To prevent excessive current damaging the LED", "To change its color", "To add voltage"], answer: 1, explanation: "Without a resistor, LEDs draw too much current and burn out." },
    { q: "A transistor can:", options: ["Only amplify", "Only switch", "Amplify and switch", "Only filter"], answer: 2, explanation: "Transistors work as both amplifiers and switches." },
    { q: "Electrical power is calculated as:", options: ["P = V × I", "P = V / I", "P = I / V", "P = V + I"], answer: 0, explanation: "Power = voltage × current." }
  ]},
  mechatronics: { title: 'Mechatronics', level: 'intermediate', questions: [
    { q: "Mechatronics is a combination of:", options: ["Mechanical, electrical, and control engineering", "Only mechanical engineering", "Only electrical engineering", "Chemistry and physics"], answer: 0, explanation: "Mechatronics blends mechanical, electrical, and control engineering." },
    { q: "A sensor's primary role is to:", options: ["Measure a physical quantity and convert it to a signal", "Generate power", "Store data", "Do nothing"], answer: 0, explanation: "Sensors convert physical quantities into signals." },
    { q: "PID stands for:", options: ["Proportional-Integral-Derivative", "Positive-Inverse-Digital", "Programmable-Input-Device", "Power-Integrator-Driver"], answer: 0, explanation: "PID is the classic control algorithm." },
    { q: "Which of these is an actuator?", options: ["Thermistor", "Motor", "LDR", "Sensor"], answer: 1, explanation: "Actuators convert signals into physical action." },
    { q: "A gear ratio primarily trades:", options: ["Torque for voltage", "Speed for torque", "Current for power", "Nothing"], answer: 1, explanation: "Gears trade speed for torque (or vice versa)." },
    { q: "A rotary encoder measures:", options: ["Temperature", "Angular position and speed", "Light intensity", "Pressure"], answer: 1, explanation: "Encoders measure rotation." },
    { q: "PLC stands for:", options: ["Programmable Logic Controller", "Programmed Line Circuit", "Power Line Communication", "Process Logic Counter"], answer: 0, explanation: "PLCs are industrial controllers." },
    { q: "Closed-loop control relies on:", options: ["Guesswork", "Feedback from sensors", "Time only", "Manual input"], answer: 1, explanation: "Closed-loop uses sensor feedback." },
    { q: "A stepper motor moves in:", options: ["Continuous smooth motion", "Discrete steps", "Only backwards", "Random directions"], answer: 1, explanation: "Steppers move in discrete steps." },
    { q: "An H-bridge is used to:", options: ["Control DC motor direction", "Measure temperature", "Change LED color", "Filter signals"], answer: 0, explanation: "H-bridges reverse motor polarity." }
  ]},
  programming: { title: 'Programming', level: 'intermediate', questions: [
    { q: "Which of these is a valid variable name in most languages?", options: ["2name", "my-var", "my_var", "class"], answer: 2, explanation: "Underscores are valid; dashes and leading digits are not." },
    { q: "A function that returns nothing in Python implicitly returns:", options: ["0", "None", "False", "An error"], answer: 1, explanation: "Python returns None by default." },
    { q: "What does `git commit -m 'msg'` do?", options: ["Uploads to GitHub", "Saves a snapshot locally", "Deletes the file", "Fetches remote changes"], answer: 1, explanation: "Commit saves a local snapshot." },
    { q: "Which is the safest way to debug a bug you can't reproduce?", options: ["Guess and change code", "Add print statements everywhere", "Reproduce it reliably first", "Restart the computer"], answer: 2, explanation: "Reliable reproduction is the first step." },
    { q: "In Python, `const` is used for:", options: ["Immutable variables", "It doesn't exist in Python", "Constants only", "Function returns"], answer: 1, explanation: "Python has no `const` — use ALL_CAPS convention." },
    { q: "What is variable scope?", options: ["How fast the variable runs", "Where the variable is accessible in code", "The size of the variable", "The variable's type"], answer: 1, explanation: "Scope defines where a variable is visible." },
    { q: "Which command stages ALL changed files in Git?", options: ["git add .", "git commit", "git push", "git status"], answer: 0, explanation: "`git add .` stages all changes." },
    { q: "A `while` loop is best used when:", options: ["You know the exact number of iterations", "The number of iterations is unknown", "You want infinite execution always", "Never"], answer: 1, explanation: "Use `while` for unknown iteration counts." },
    { q: "Which error message tells you the most about a bug?", options: ["The error type", "The error line number", "The stack trace", "All of them together"], answer: 3, explanation: "The full stack trace plus error type tells you the most." },
    { q: "In JavaScript, `let` vs `const` — the main difference is:", options: ["Speed", "const can't be reassigned", "let is deprecated", "No difference"], answer: 1, explanation: "const can't be reassigned; let can." }
  ]},
  simulation: { title: 'Simulation', level: 'intermediate', questions: [
    { q: "The main reason to simulate before building hardware is:", options: ["It looks cooler", "Cheaper, safer, faster iteration", "Required by law", "Prevents all bugs"], answer: 1, explanation: "Simulation is cheap, safe, and fast." },
    { q: "Which is a limitation of circuit simulation?", options: ["You can't use components", "It doesn't model real noise and thermal effects", "It's always wrong", "You need hardware"], answer: 1, explanation: "Sims miss noise, thermal, and other real-world effects." },
    { q: "Tinkercad Circuits is best for:", options: ["Advanced ESP32 projects", "Beginners learning breadboard wiring", "Running real Arduino code on hardware", "PCB design"], answer: 1, explanation: "Tinkercad is great for beginners." },
    { q: "Wokwi supports which feature Tinkercad lacks?", options: ["LEDs", "Real libraries like WiFi and NeoPixel", "Resistors", "Breadboards"], answer: 1, explanation: "Wokwi supports real Arduino/ESP32 libraries." },
    { q: "For Python physics simulations, the two standard libraries are:", options: ["pandas and scipy", "numpy and matplotlib", "flask and django", "tkinter and pygame"], answer: 1, explanation: "numpy for math, matplotlib for plots." },
    { q: "PyBullet and MuJoCo are used for:", options: ["Web development", "Rigid-body physics simulation", "Circuit simulation", "Image editing"], answer: 1, explanation: "They simulate rigid-body physics." },
    { q: "SPICE is a standard for:", options: ["Text formatting", "Electronic circuit simulation", "3D modeling", "Databases"], answer: 1, explanation: "SPICE simulates electronic circuits." },
    { q: "Which is NOT a good reason to simulate?", options: ["Test logic cheaply", "Avoid burning components", "Replace all real-world testing", "Iterate quickly"], answer: 2, explanation: "Sims don't fully replace real testing." },
    { q: "In numpy, `np.linspace(0, 4, 200)` creates:", options: ["200 random numbers", "200 evenly-spaced values from 0 to 4", "4 values from 0 to 200", "A single value"], answer: 1, explanation: "linspace creates evenly-spaced values." },
    { q: "The rule of thumb for simulation is:", options: ["Simulate everything", "Never simulate", "Simulate the logic, build the physics", "Simulate only bugs"], answer: 2, explanation: "Simulate logic; test physics for real." }
  ]},
  robotics: { title: 'Robotics', level: 'advanced', questions: [
    { q: "Degrees of freedom (DoF) refers to:", options: ["Number of independent motions", "Number of motors", "Arm length", "Robot weight"], answer: 0, explanation: "Each independent joint = one DoF." },
    { q: "Forward kinematics computes:", options: ["Joint angles → end effector position", "End effector position → joint angles", "Torque → speed", "Power → force"], answer: 0, explanation: "FK: angles → position." },
    { q: "Inverse kinematics computes:", options: ["Joint angles → position", "Desired end position → joint angles", "Voltage → current", "Speed → torque"], answer: 1, explanation: "IK: position → angles." },
    { q: "The end effector is:", options: ["A joint", "A motor", "The tool at the end of the arm", "A sensor on the base"], answer: 2, explanation: "The end effector is the working tool." },
    { q: "ROS stands for:", options: ["Robot Operating System", "Rapid Object Scanner", "Rotating Optical Sensor", "Range Optical System"], answer: 0, explanation: "ROS = Robot Operating System." },
    { q: "SLAM stands for:", options: ["Simultaneous Localization and Mapping", "Sensor Linear Actuator Module", "Static Line Access Map", "Systematic Local Area Mesh"], answer: 0, explanation: "SLAM is a classic robotics problem." },
    { q: "Which is a common robot joint type?", options: ["Revolute", "Resistor", "Reactor", "Router"], answer: 0, explanation: "Revolute joints rotate." },
    { q: "Lidar measures distance using:", options: ["Sound", "Laser light", "Magnetic fields", "Infrared only"], answer: 1, explanation: "Lidar uses laser light." },
    { q: "A servo motor is typically used to:", options: ["Rotate continuously without stopping", "Hold a commanded position precisely", "Run only in reverse", "Generate power"], answer: 1, explanation: "Servos hold precise angles." },
    { q: "Odometry estimates robot position using:", options: ["GPS only", "Wheel rotation data", "Cameras only", "A compass"], answer: 1, explanation: "Odometry uses wheel rotation data." }
  ]},
  ai: { title: 'Artificial Intelligence', level: 'advanced', questions: [
    { q: "Machine learning learns primarily from:", options: ["Data", "Random guesses", "Dice rolls", "Hand-written rules"], answer: 0, explanation: "ML learns from data." },
    { q: "Supervised learning requires:", options: ["Labeled training data", "Unlabeled data only", "No data", "Random noise"], answer: 0, explanation: "Supervised learning needs labels." },
    { q: "A typical neural network has:", options: ["Only an input layer", "Only an output layer", "Input, hidden, and output layers", "One layer total"], answer: 2, explanation: "Input, hidden, output." },
    { q: "The difference between training and inference is:", options: ["Training learns parameters; inference uses them", "They are identical", "Inference trains the model", "Training runs the model"], answer: 0, explanation: "Training → parameters; inference → predict." },
    { q: "Overfitting means the model:", options: ["Performs well on training data but poorly on new data", "Performs perfectly on all data", "Never learns", "Runs too slowly"], answer: 0, explanation: "Overfitting is memorizing training data." },
    { q: "Activation functions are used to:", options: ["Introduce non-linearity", "Make the network linear", "Shrink file size", "Store training data"], answer: 0, explanation: "Activations add non-linearity." },
    { q: "Transformer models are based on:", options: ["Attention mechanisms", "Convolutions only", "Recurrence only", "Sorting algorithms"], answer: 0, explanation: "Transformers use self-attention." },
    { q: "Gradient descent is used to:", options: ["Minimize the loss function", "Maximize the loss function", "Do nothing", "Randomly pick answers"], answer: 0, explanation: "Gradient descent minimizes loss." },
    { q: "Reinforcement learning learns from:", options: ["Rewards and penalties", "Labeled examples", "No feedback", "Random noise"], answer: 0, explanation: "RL learns from reward signals." },
    { q: "LLM stands for:", options: ["Large Language Model", "Linear Logic Machine", "Long Latent Memory", "Low Level Method"], answer: 0, explanation: "LLM = Large Language Model." }
  ]}
};

// Insert quizzes
console.log('Seeding quizzes...');
const findQuiz = db.prepare('SELECT id FROM quizzes WHERE quiz_key=?');
const insertQuiz = db.prepare('INSERT INTO quizzes (quiz_key, title, level, order_num) VALUES (?, ?, ?, ?)');
const deleteQuestions = db.prepare('DELETE FROM quiz_questions WHERE quiz_id=?');
const insertQ = db.prepare('INSERT INTO quiz_questions (quiz_id, q, options, answer, explanation, order_num) VALUES (?, ?, ?, ?, ?, ?)');

let inserted = 0;
let totalQuestions = 0;

Object.entries(quizzes).forEach(([key, quiz], idx) => {
  const existing = findQuiz.get(key);
  let qid;
  if (existing) {
    qid = existing.id;
    deleteQuestions.run(qid);
    db.prepare('UPDATE quizzes SET title=?, level=?, order_num=? WHERE id=?')
      .run(quiz.title, quiz.level, idx, qid);
    console.log(`  ↻ ${key} — updated`);
  } else {
    const info = insertQuiz.run(key, quiz.title, quiz.level, idx);
    qid = Number(info.lastInsertRowid);
    console.log(`  + ${key} — inserted`);
  }
  quiz.questions.forEach((q, i) => {
    insertQ.run(qid, q.q, JSON.stringify(q.options), q.answer, q.explanation || '', i);
    totalQuestions++;
  });
  inserted++;
});

console.log('\n=== VERIFICATION ===');
console.log('quizzes:', db.prepare('SELECT COUNT(*) as c FROM quizzes').get().c);
console.log('quiz_questions:', db.prepare('SELECT COUNT(*) as c FROM quiz_questions').get().c);
console.log(`\nSeeded ${inserted} quizzes with ${totalQuestions} total questions ✓`);