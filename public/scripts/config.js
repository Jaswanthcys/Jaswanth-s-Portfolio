export const portfolioConfig = Object.freeze({
  identity: {
    name: "JASWANTH'S PORTFOLIO",
    firstName: "JASWANTH",
    lastName: "MARELLA",
    role: "Computer Science & Engineering Student",
    location: "Amritapuri",
    country: "India",
    countryCode: "IND",
    brand: "MJ // PERSONAL ARCHIVE",
    quote: "I build immersive, cinematic and interactive experiences for the web.",
  },
  hud: {
    status: "BUILDING",
    level: "CSE // CYBER SECURITY",
  },
  links: {
    email: "marellajaswanth@gmail.com", // Set the owner's real contact email before sharing.
    github: "https://github.com/Jaswanthcys", // Set the owner's real profile URL before sharing.
    linkedin: "https://www.linkedin.com/in/jaswanth-marella-7519b4333/", // Set the owner's real profile URL before sharing.
  },
  profile: {
    education: "B.Tech 3rd Year — Computer Science & Engineering (Cyber Security), Amrita Vishwa Vidyapeetham",
    interests: "Game Development, Blender, and Web Development — especially cinematic and immersive experiences",
    currentFocus: "Creating cinematic 3D motion experiences for the web and building immersive interactive websites",
    availability: "Available anytime for projects, collaborations, and creative work",
  },
  skills: [
    {
      name: "Programming",
      items: ["C", "C++", "Java", "Python", "SQL", "JavaScript"],
      rating: 3,
    },
    {
      name: "Cyber Security",
      items: ["Linux", "Wireshark", "Networking",],
      rating: 3,
    },
    {
      name: "Web Development",
      items: ["HTML", "CSS", "JavaScript", "React.js", "Node.js", "Express.js","Figma"],
      rating: 4,
    },
    {
      name: "Game Development",
      items: ["Unity", "C#", "Blender"],
      rating: 4,
    },
    {
      name: "Tools",
      items: ["Git", "GitHub", "GitHub Desktop", "Visual Studio Code", "MS Office"],
      rating: 3,
    },
  ],
  projects: [
    
    {
      title: "MEMORY//LEAK",
      description:
        "MEMORY//LEAK is an interactive cybersecurity simulation game where players take the role of a SOC analyst defending the fictional organization NEXUS from evolving cyber threats.",
      details:
        "Players investigate alerts, analyze evidence, identify attack patterns, and choose appropriate defensive actions against threats such as phishing, malware, credential theft, ransomware, and data exfiltration. The game features an adaptive attacker called ZERO, which observes the player's defensive behavior and changes future attack patterns, creating a dynamic and replayable experience. The goal is to transform cybersecurity learning into an engaging, decision-based experience where every investigation and response can influence the outcome of the incident.",
      technologies: [
        "Cybersecurity",
        "Threat Detection",
        "Incident Response",
        "SOC Simulation",
        "Three.js",
      ],
      github: "",
      live: "",
    },
    {
      title: "Shadow Memory",
      description:
        "A 3D memory puzzle adventure game built with Unity, C#, and Blender.",
      details:
        "Developed an original 3D memory-based puzzle adventure game with procedural path generation, checkpoints, memory-driven puzzle mechanics, modular gameplay architecture, interactive UI, and scalable systems designed for future expansion.",
      technologies: ["Unity 6", "C#", "Blender", "Visual Studio Code"],
      github: "https://github.com/Jaswanthcys/ShadowMemory",
      live: "",
    },
  
    {
      title: "Robel Wear",
      description:
        "A full-stack MERN e-commerce application with authentication, payments, and an admin dashboard.",
      details:
        "Developed a MERN e-commerce application with user authentication, shopping cart functionality, payment integration, an admin dashboard, JWT, OAuth, Razorpay, and REST APIs.",
      technologies: ["React.js", "Node.js", "Express.js", "MongoDB"],
      github: "",
      live: "",
    },
  
    {
      title: "Flight Booking System",
      description:
        "A responsive flight booking interface built with interactive web technologies.",
      details:
        "Developed a responsive flight booking interface with form validation and interactive UI functionality.",
      technologies: ["HTML", "CSS", "JavaScript"],
      github: "https://github.com/Jaswanthcys/flight-ticket-booking-system",
      live: "",
    },
  
    {
      title: "Railway Ticket Booking System",
      description:
        "A database-driven railway ticket booking system designed around structured data management.",
      details:
        "Designed a normalized database and implemented CRUD operations for a railway ticket booking system.",
      technologies: ["SQL", "DBMS"],
      github: "",
      live: "",
    },

    {
      title: "GuardianMesh",
      description:
        "GuardianMesh AI is a Zero-Trust security platform for AI agents using MCP (Model Context Protocol). ",
      details:
        "Threat detection for AI/MCP interactions: prompt injection, command and SQL injection, XSS, credential and SSH-key leaks, phishing and supply-chain URLs — scored 0–100 with confidence and an explanation.",
      technologies: ["TypeScript / React" , "AI Security · Hackathon" , "JAVA SCRIPT"],
      github: "https://github.com/Jaswanthcys/Guardianmesh-Threat-detection",
      live: "https://gaurdianmesh-threat-detection.onrender.com/",
    },
  
    {
      title: "Boulder",
      description:
        "A 3D adventure game featuring physics-based interactions and real-time player movement.",
      details:
        "Developed a 3D adventure game with physics-based interactions, collision detection, obstacle interaction, checkpoint progression, reusable gameplay scripts, interactive environments, and scalable game architecture.",
      technologies: ["Unity 6", "C#", "Blender"],
      github: "https://github.com/Jaswanthcys/Boulder-ball",
      live: "",
    },
  
    {
      title: "Gravity Flip",
      description:
        "A 2D endless arcade platformer built around gravity-based obstacle-avoidance gameplay.",
      details:
        "Implemented procedural obstacle spawning, collision detection, scoring, persistent high scores, responsive UI, restart functionality, and modular reusable gameplay systems using object-oriented programming.",
      technologies: ["Unity", "C#", "Blender", "Visual Studio Code"],
      github: "",
      live: "",
    },
  ],
  certificates: [
    {
      title: "Introduction to Deep Learning with PyTorch",
      issuer: "DataCamp",
      date: "Sep 01, 2026",
      image: "/assets/certificates/datacamp-pytorch.png",
    },
  
    {
      title: "Gameathon 2026 — 2nd Position",
      issuer: "Amrita Cyber Nation — 5th Edition",
      date: "Sep 07–09, 2026",
      image: "/assets/certificates/gameathon-2026.jpeg",
    },
  
    {
      title: "Amrita University Amritapuri Campus Hackathon",
      issuer: "Amrita Vishwa Vidyapeetham",
      date: "Jul 17–18, 2026",
      image: "/assets/certificates/hackathon-2026.png",
    },
  
    {
      title: "Qiskit Fall Fest 2025",
      issuer: "IBM Quantum",
      date: "Nov 25, 2025",
      image: "/assets/certificates/ibm-qiskit-2025.jpeg",
    },
  
    {
      title: "Nasha Mukt Yuva for Viksit Bharat",
      issuer: "Mera Yuva Bharat",
      date: "2026",
      image: "/assets/certificates/nasha-mukt-yuva.jpeg",
    },
  
    {
      title: "Oracle SQL",
      issuer: "Great Learning",
      date: "Oct 03, 2025",
      image: "/assets/certificates/oracle-sql.png",
    },
  ],
  journey: [
    {
      year: "2024",
      detail: "Started from Zero — Began Learning Computers and Wrote My First Lines of Code",
    },
    {
      year: "2024",
      detail: "Built My First Website — An Expense Tracker That Started My Web Development Journey",
    },
    {
      year: "2025",
      detail: "Built More Websites and Started Exploring Modern Web Development",
    },
    {
      year: "2025",
      detail: "Started My Game Development Journey with ACM, Learning Unity, C#, Blender, and Interactive Game Design",
    },
    {
      year: "2026",
      detail: "Won 2nd Position in Gameathon 2026 and Continued Building Interactive Experiences",
    },
    {
      year: "NEXT",
      detail: "Building Cinematic 3D and Motion-Driven Experiences for the Web",
    },
  ],
  scene: {
    image: "/assets/moonlit-scene.webp",
    icon: "/assets/km-logo.png",
    video: "", // Optionally set to "/assets/samurai-bg.mp4" when supplied.
    videoPoster: "/assets/samurai-bg.webp", // Optional still poster for a local video.
    introDurationMs: 12800,
    ambientLoopMs: 10000,
  },
  skillsRating: {
    max: 5,
    label: "",
  },
});
