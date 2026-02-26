"use client";

import { motion } from "framer-motion";
import { Upload, ShieldCheck, FileSignature, Database, ArrowRight } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Ingest Data",
    description: "Securely upload your digital assets or data streams to our verifiable ingestion layer.",
    icon: Upload,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    id: 2,
    title: "Verify Integrity",
    description: "Trusted Execution Environments (TEEs) process and verify the authenticity of the data.",
    icon: ShieldCheck,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    id: 3,
    title: "Generate Proof",
    description: "Cryptographic proofs are generated to certify the verification result without revealing sensitive data.",
    icon: FileSignature,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
  },
  {
    id: 4,
    title: "On-Chain Record",
    description: "The proof is permanently recorded on the Stellar blockchain via Soroban smart contracts.",
    icon: Database,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
];

export default function HowItWorks() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section id="how-it-works" className="py-24 bg-white dark:bg-[#020617] relative overflow-hidden transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6"
          >
            How <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">StellarProof</span> Works
          </motion.h2>
          <motion.p 
            variants={itemVariants}
            className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400"
          >
            A seamless pipeline from raw data to immutable blockchain proof.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative"
        >
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent z-0 transform translate-y-8" />

          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              variants={itemVariants}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div 
                className={`w-20 h-20 rounded-2xl ${step.bgColor} border ${step.borderColor} flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 shadow-lg`}
              >
                <step.icon className={`w-10 h-10 ${step.color}`} />
              </div>
              
              <div className="bg-white dark:bg-[#020617] px-2 relative z-10">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>

              {/* Arrow for Mobile/Tablet */}
              {index < steps.length - 1 && (
                <div className="lg:hidden mt-6 text-gray-300 dark:text-gray-700">
                  <ArrowRight className="w-6 h-6 transform rotate-90 md:rotate-0" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
