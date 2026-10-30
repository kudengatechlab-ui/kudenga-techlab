const db = require('./lib/db');

// ============================================================
// NOTES (20 total)
// ============================================================
const notes = [
  { key: 'resistors', title: 'Reading Resistors', category: 'electronics', meta: 'Electronics · Beginner', summary: 'How to decode the colour bands.', thumb: '🎨',
    content: `
<h3>The four-band system</h3>
<ol><li><strong>Band 1</strong> — first digit</li><li><strong>Band 2</strong> — second digit</li><li><strong>Band 3</strong> — multiplier</li><li><strong>Band 4</strong> — tolerance (gold = ±5%, silver = ±10%)</li></ol>
<h3>Colour values</h3>
<ul><li>Black=0 · Brown=1 · Red=2 · Orange=3</li><li>Yellow=4 · Green=5 · Blue=6 · Violet=7</li><li>Grey=8 · White=9 · Gold=×0.1 · Silver=×0.01</li></ul>
<h3>Example</h3>
<p>Bands <strong>Red · Red · Brown · Gold</strong> = 2, 2, ×10 = <strong>220 Ω ±5%</strong>.</p>` },
  { key: 'ohms-law', title: "Ohm's Law", category: 'electronics', meta: 'Theory · Fundamental', summary: 'V = IR — the single most useful equation.', thumb: '⚡',
    content: `
<p>Ohm's Law links voltage (V), current (I), and resistance (R):</p>
<pre>V = I × R</pre>
<p>Rearranged: <code>I = V / R</code>, <code>R = V / I</code>.</p>
<h3>Example</h3>
<p>5 V supply, red LED needs 2 V at 20 mA:</p>
<pre>R = (5 − 2) / 0.02 = 150 Ω → use 220 Ω standard</pre>` },
  { key: 'capacitors', title: 'Capacitors Explained', category: 'electronics', meta: 'Electronics · Component', summary: 'What they store and how they behave.', thumb: '🔋',
    content: `
<p>A capacitor stores energy in an electric field. Units: pF, nF, µF.</p>
<h3>Two types</h3>
<ul><li><strong>Ceramic</strong> — non-polarised, high-frequency filtering</li><li><strong>Electrolytic</strong> — polarised, large energy storage</li></ul>
<h3>Safety rule</h3>
<p>Electrolytics have polarity — connecting backwards can damage them. Always check the stripe before power.</p>` },
  { key: 'leds', title: 'Using LEDs Safely', category: 'electronics', meta: 'Electronics · Beginner', summary: 'Why every LED needs a resistor.', thumb: '💡',
    content: `
<p>LEDs have a forward voltage drop (~2 V red, ~3 V blue) and max current (~20 mA). Never connect directly to power.</p>
<pre>R = (V_supply − V_LED) / I_target</pre>
<h3>Quick reference (5 V)</h3>
<ul><li>Red (2 V) → 220 Ω</li><li>Green (2.1 V) → 220 Ω</li><li>Blue/White (3.2 V) → 100 Ω</li></ul>
<h3>Which leg?</h3>
<p>Longer leg = anode (+). Shorter = cathode (−).</p>` },
  { key: 'breadboards', title: 'Breadboard Basics', category: 'electronics', meta: 'Electronics · Beginner', summary: 'How the holes connect.', thumb: '🧩',
    content: `
<h3>How holes connect</h3>
<ul><li><strong>Power rails</strong> (top/bottom rows) — all connected</li><li><strong>Rows</strong> — 5 holes per side; middle gap separates left/right</li></ul>
<h3>Common mistakes</h3>
<ul><li>Thinking the whole row is connected</li><li>Plugging both legs of a component into the same row</li><li>Forgetting to bridge power rails</li></ul>` },
  { key: 'robot-anatomy', title: 'Robot Anatomy', category: 'robotics', meta: 'Robotics · Fundamental', summary: 'Links, joints, DoF, and end effectors.', thumb: '🤖',
    content: `
<p>Every manipulator is built from two things: <strong>links</strong> (rigid bodies) and <strong>joints</strong> (connections that move). A robot's capability is set by how many joints it has and how they can move.</p>
<h3>Joint types</h3>
<ul><li><strong>Revolute</strong> — rotation (door hinge, robot elbow)</li><li><strong>Prismatic</strong> — linear sliding (drawer, linear actuator)</li><li><strong>Spherical</strong> — 3-axis rotation (shoulder)</li></ul>
<h3>Degrees of freedom (DoF)</h3>
<p>Each independent joint = one DoF. A full spatial pose needs <strong>6 DoF</strong>.</p>` },
  { key: 'kinematics', title: 'Forward & Inverse Kinematics', category: 'robotics', meta: 'Robotics · Math', summary: 'The math that moves a robot arm.', thumb: '📐',
    content: `
<p><strong>Forward kinematics (FK)</strong>: given joint angles, compute where the tool is.</p>
<pre>x = L₁·cos(θ₁) + L₂·cos(θ₁ + θ₂)
y = L₁·sin(θ₁) + L₂·sin(θ₁ + θ₂)</pre>
<p><strong>Inverse kinematics (IK)</strong>: given the target (x, y), solve for θ₁ and θ₂.</p>
<p><strong>Rule of thumb:</strong> FK is always unique; IK can have zero, one, or many solutions.</p>` },
  { key: 'servo-stepper', title: 'Servo & Stepper Control', category: 'robotics', meta: 'Robotics · Actuators', summary: 'PWM angles and discrete steps.', thumb: '⚙️',
    content: `
<h3>Hobby servo (position)</h3>
<p>Controlled by a 50 Hz PWM signal — 1 ms = 0°, 2 ms = 180°.</p>
<h3>Stepper motor (steps)</h3>
<p>Moves in discrete steps — a NEMA 17 with 1.8° step = 200 steps/revolution.</p>
<p>Use a <strong>servo</strong> for bounded position; use a <strong>stepper</strong> for precise open-loop motion.</p>` },
  { key: 'ros-intro', title: 'Intro to ROS', category: 'robotics', meta: 'Robotics · Software', summary: 'Nodes, topics, and the ROS 2 toolchain.', thumb: '🐢',
    content: `
<p><strong>ROS 2</strong> (Robot Operating System) is the standard framework for robot software.</p>
<h3>Core concepts</h3>
<ul><li><strong>Nodes</strong> — separate processes</li><li><strong>Topics</strong> — publish/subscribe channels</li><li><strong>Services</strong> — request/response calls</li><li><strong>Actions</strong> — long-running tasks with feedback</li></ul>` },
  { key: 'what-is-ml', title: 'What is Machine Learning?', category: 'ai', meta: 'AI · Fundamental', summary: 'Supervised, unsupervised, and reinforcement.', thumb: '🧠',
    content: `
<p>Machine learning is finding a function <code>f</code> that maps inputs to outputs, <em>learned from examples</em>.</p>
<h3>Three paradigms</h3>
<ul><li><strong>Supervised</strong> — labeled examples</li><li><strong>Unsupervised</strong> — no labels, clustering</li><li><strong>Reinforcement</strong> — agent learns from rewards</li></ul>` },
  { key: 'neural-networks', title: 'Neural Networks in 5 Minutes', category: 'ai', meta: 'AI · Model', summary: 'Layers, weights, activation, backprop.', thumb: '🕸️',
    content: `
<p>A neural network is a stack of <strong>layers</strong>, each made of <strong>neurons</strong>.</p>
<h3>The flow</h3>
<ol><li>Forward pass</li><li>Loss</li><li>Backpropagation</li><li>Update weights</li></ol>` },
  { key: 'llms', title: 'How LLMs Work', category: 'ai', meta: 'AI · Model', summary: 'Tokens, attention, and next-token prediction.', thumb: '💬',
    content: `
<p>A <strong>Large Language Model</strong> is a transformer trained to predict the next token.</p>
<h3>Pipeline</h3>
<ol><li>Tokenize</li><li>Embed</li><li>Attention</li><li>Predict</li><li>Sample</li></ol>` },
  { key: 'prompt-engineering', title: 'Prompt Engineering Basics', category: 'ai', meta: 'AI · Practice', summary: 'Get better output from any LLM.', thumb: '✍️',
    content: `
<h3>Six habits</h3>
<ul><li><strong>Be specific.</strong></li><li><strong>Give an example.</strong> (few-shot)</li><li><strong>Set a role.</strong></li><li><strong>Ask for structure.</strong></li><li><strong>Iterate.</strong></li><li><strong>Ask for reasoning first.</strong></li></ul>` },
  { key: 'variables', title: 'Variables & Data Types', category: 'programming', meta: 'Programming · Fundamental', summary: 'Numbers, strings, lists, dicts — compared.', thumb: '🔢',
    content: `
<h3>Python</h3>
<pre>age = 25              # int
pi = 3.14             # float
name = "Ada"          # str
active = True         # bool
items = [1, 2, 3]     # list
person = {"name": "Ada"}  # dict</pre>
<h3>JavaScript</h3>
<pre>let age = 25;
const pi = 3.14;
let name = "Ada";
let active = true;</pre>` },
  { key: 'functions', title: 'Functions & Scope', category: 'programming', meta: 'Programming · Fundamental', summary: 'Parameters, returns, and why scope matters.', thumb: '🔧',
    content: `
<pre>def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Ada"))            # Hello, Ada!</pre>
<h3>Scope</h3>
<p>Variables inside a function are <strong>local</strong> — they vanish when the function returns.</p>` },
  { key: 'git', title: 'Git in 10 Minutes', category: 'programming', meta: 'Programming · Tooling', summary: 'The 8 commands you actually use daily.', thumb: '🌿',
    content: `
<pre>git status
git add .
git commit -m "message"
git push
git pull
git log --oneline
git checkout -b feature</pre>` },
  { key: 'debugging', title: 'Debugging Like a Pro', category: 'programming', meta: 'Programming · Skill', summary: 'Read the error. Reproduce. Isolate. Fix.', thumb: '🐛',
    content: `
<ol><li><strong>Read the error.</strong> All of it.</li><li><strong>Reproduce reliably.</strong></li><li><strong>Isolate.</strong></li><li><strong>Fix and verify.</strong></li></ol>` },
  { key: 'why-simulate', title: 'Why Simulate First?', category: 'simulation', meta: 'Simulation · Practice', summary: 'Cheap, safe, fast iteration before hardware.', thumb: '🧪',
    content: `
<h3>Upside</h3>
<ul><li><strong>Cheap.</strong></li><li><strong>Safe.</strong></li><li><strong>Fast.</strong></li><li><strong>Portable.</strong></li></ul>
<p>Rule of thumb: <strong>simulate the logic, build the physics</strong>.</p>` },
  { key: 'tinkercad-wokwi', title: 'Tinkercad & Wokwi', category: 'simulation', meta: 'Simulation · Tools', summary: 'Two browser simulators compared.', thumb: '🖥️',
    content: `
<h3>Tinkercad Circuits</h3>
<ul><li>Drag-and-drop Arduino</li><li>Best for: total beginners</li></ul>
<h3>Wokwi</h3>
<ul><li>Arduino, ESP32, STM32</li><li>Real libraries</li><li>Best for: intermediate users</li></ul>` },
  { key: 'python-sim', title: 'Python for Simulation', category: 'simulation', meta: 'Simulation · Coding', summary: 'Model physics with numpy & matplotlib.', thumb: '🐍',
    content: `
<pre>import numpy as np
import matplotlib.pyplot as plt

v0, angle, g = 20, np.radians(45), 9.81
t = np.linspace(0, 4, 200)
x = v0 * np.cos(angle) * t
y = v0 * np.sin(angle) * t - 0.5 * g * t**2

plt.plot(x, y)</pre>` }
];

// ============================================================
// PROTOTYPES (7 total)
// ============================================================
const prototypes = [
  { key: 'led-blink', title: 'LED Blink', category: 'Beginner', meta: 'Beginner · ~15 minutes · Arduino', summary: 'The classic first Arduino project.', thumb: '💡',
    content: `
<h3>What you need</h3>
<ul><li>1 × Arduino Uno</li><li>1 × LED</li><li>1 × 220 Ω resistor</li><li>2 × jumper wires</li><li>1 × breadboard</li></ul>
<h3>Wiring</h3>
<ol><li>Connect Arduino GND to breadboard negative rail.</li><li>Plug LED — longer leg (anode) into resistor row.</li><li>220 Ω resistor from anode row to Arduino pin 13.</li><li>Cathode row to GND rail.</li></ol>
<h3>Code</h3>
<pre>void setup() {
  pinMode(13, OUTPUT);
}
void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}</pre>` },
  { key: 'traffic-light', title: 'Traffic Light', category: 'Beginner', meta: 'Beginner · ~30 minutes · Arduino', summary: 'Three LEDs cycling like an intersection.', thumb: '🚦',
    content: `
<h3>What you need</h3>
<ul><li>1 × Arduino Uno</li><li>3 × LEDs (R/Y/G)</li><li>3 × 220 Ω resistors</li><li>Breadboard + wires</li></ul>
<h3>Code</h3>
<pre>int red=10, yellow=9, green=8;
void setup() {
  pinMode(red, OUTPUT);
  pinMode(yellow, OUTPUT);
  pinMode(green, OUTPUT);
}
void loop() {
  digitalWrite(red, HIGH); delay(3000); digitalWrite(red, LOW);
  digitalWrite(green, HIGH); delay(3000); digitalWrite(green, LOW);
  digitalWrite(yellow, HIGH); delay(1000); digitalWrite(yellow, LOW);
}</pre>` },
  { key: 'motion-alarm', title: 'Motion Alarm', category: 'Intermediate', meta: 'Intermediate · ~45 minutes · Arduino', summary: 'PIR sensor + buzzer intruder alarm.', thumb: '🔔',
    content: `
<h3>What you need</h3>
<ul><li>1 × Arduino Uno</li><li>1 × PIR sensor</li><li>1 × active buzzer</li><li>Jumper wires</li></ul>
<h3>Code</h3>
<pre>int pirPin=2, buzzerPin=8;
void setup() {
  pinMode(pirPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
}
void loop() {
  if (digitalRead(pirPin)==HIGH) {
    tone(buzzerPin, 1000);
    delay(500);
    noTone(buzzerPin);
  }
}</pre>` },
  { key: 'plant-waterer', title: 'Auto Plant Waterer', category: 'Intermediate', meta: 'Intermediate · ~1 hour · Arduino', summary: 'Soil moisture triggers a pump.', thumb: '🌱',
    content: `
<h3>What you need</h3>
<ul><li>1 × Arduino Uno</li><li>1 × soil moisture sensor</li><li>1 × relay module</li><li>1 × small DC pump</li><li>External supply + tubing</li></ul>
<h3>Code</h3>
<pre>int sensorPin=A0, relayPin=7, threshold=400;
void setup() { pinMode(relayPin, OUTPUT); Serial.begin(9600); }
void loop() {
  int moisture = analogRead(sensorPin);
  Serial.println(moisture);
  digitalWrite(relayPin, moisture &lt; threshold ? HIGH : LOW);
  delay(1000);
}</pre>` },
  { key: 'esp32-wifi-sensor', title: 'ESP32 WiFi Sensor', category: 'Intermediate', meta: 'Intermediate · ~45 minutes · ESP32', summary: 'DHT22 temperature posted to a local web dashboard.', thumb: '📶',
    content: `
<h3>What you need</h3>
<ul><li>1 × ESP32 dev board</li><li>1 × DHT22 sensor</li><li>1 × 10 kΩ resistor</li><li>Breadboard + jumper wires</li></ul>
<h3>Wiring</h3>
<ol><li>DHT22 VCC → ESP32 3.3V</li><li>DHT22 GND → ESP32 GND</li><li>DHT22 DATA → ESP32 GPIO 4</li></ol>
<p>Open serial monitor → copy IP address → paste in phone browser.</p>` },
  { key: 'robot-arm-2dof', title: '2-DoF Robotic Arm', category: 'Intermediate', meta: 'Intermediate · ~1 hour · Arduino', summary: 'Two servos + inverse kinematics in Arduino.', thumb: '🦾',
    content: `
<h3>What you need</h3>
<ul><li>1 × Arduino Uno</li><li>2 × hobby servos</li><li>1 × 5V power supply (≥ 2 A)</li><li>2 × arm segments</li></ul>
<h3>Wiring</h3>
<ol><li>Servo 1 signal → Arduino pin 9</li><li>Servo 2 signal → Arduino pin 10</li><li>Both servo VCCs → external 5V supply</li><li>External supply GND → Arduino GND</li></ol>
<h3>Watch out</h3>
<ul><li>Servos draw current spikes</li><li>MG996R servos need ~1 A each at stall</li></ul>` },
  { key: 'bjt-switch', title: 'BJT Transistor Switch', category: 'Intermediate', meta: 'Intermediate · ~40 minutes · Arduino', summary: 'Use an NPN to switch a relay from an Arduino pin.', thumb: '🔀',
    content: `
<p>An Arduino GPIO pin can safely source about <strong>20 mA</strong>. A relay coil wants 60–100 mA. Use a transistor.</p>
<h3>What you need</h3>
<ul><li>1 × Arduino Uno</li><li>1 × NPN transistor (2N2222)</li><li>1 × 1 kΩ resistor</li><li>1 × 5V relay module</li></ul>
<h3>Why the base resistor?</h3>
<p>1 kΩ limits base current to roughly 4.3 mA — plenty to saturate for loads up to a few hundred mA.</p>
<h3>Why a MOSFET is usually better</h3>
<p>A BJT wastes ~4 mA continuously; a MOSFET can switch several amps with almost no gate current.</p>` }
];

// ============================================================
// INSERT
// ============================================================
console.log('Seeding notes...');
const insertNote = db.prepare(`
  INSERT OR REPLACE INTO notes (note_key, title, category, meta, summary, content, thumb, order_num)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
notes.forEach((n, i) => {
  insertNote.run(n.key, n.title, n.category, n.meta, n.summary, n.content.trim(), n.thumb, i);
});
console.log(`  Inserted ${notes.length} notes`);

console.log('Seeding prototypes...');
const insertProto = db.prepare(`
  INSERT OR REPLACE INTO prototypes (proto_key, title, category, meta, summary, content, thumb, order_num)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
prototypes.forEach((p, i) => {
  insertProto.run(p.key, p.title, p.category, p.meta, p.summary, p.content.trim(), p.thumb, i);
});
console.log(`  Inserted ${prototypes.length} prototypes`);

// ============================================================
// VERIFY
// ============================================================
console.log('\n=== VERIFICATION ===');
console.log('notes:', db.prepare('SELECT COUNT(*) as c FROM notes').get().c);
console.log('prototypes:', db.prepare('SELECT COUNT(*) as c FROM prototypes').get().c);
console.log('\nDone ✓');