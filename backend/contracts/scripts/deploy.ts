import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();

  const batch = await ethers.deployContract('HoneyBatch1155');
  await batch.waitForDeployment();
  console.log('HoneyBatch1155:', await batch.getAddress());

  const escrow = await ethers.deployContract('PollinationEscrow');
  await escrow.waitForDeployment();
  console.log('PollinationEscrow:', await escrow.getAddress());

  await (await batch.setReconciler(deployer.address, true)).wait();
  await (await escrow.setOracle(deployer.address, true)).wait();
  console.log('reconciler and oracle registered for', deployer.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
