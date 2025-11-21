const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MedChain Oracle contracts...");
  
  // Deploy DemoRegistry (permissive for hackathon)
  console.log("\n📝 Deploying DemoRegistry...");
  const DemoRegistry = await hre.ethers.getContractFactory("DemoRegistry");
  const demo = await DemoRegistry.deploy();
  await demo.waitForDeployment();
  
  const demoAddress = await demo.getAddress();
  console.log("✅ DemoRegistry deployed to:", demoAddress);
  
  // Deploy DrugRegistry (production)
  console.log("\n📝 Deploying DrugRegistry...");
  const DrugRegistry = await hre.ethers.getContractFactory("DrugRegistry");
  const registry = await DrugRegistry.deploy();
  await registry.waitForDeployment();
  
  const registryAddress = await registry.getAddress();
  console.log("✅ DrugRegistry deployed to:", registryAddress);
  
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`DemoRegistry (Hackathon):  ${demoAddress}`);
  console.log(`DrugRegistry (Production): ${registryAddress}`);
  console.log("=".repeat(60));
  console.log("\n🔧 Copy DemoRegistry address to frontend!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
