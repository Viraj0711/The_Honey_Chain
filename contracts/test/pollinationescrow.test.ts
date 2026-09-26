import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('PollinationEscrow', () => {
  it('rejects claim without required uptime', async () => {
    const [, oracle, beekeeper] = await ethers.getSigners();
    const escrow = await ethers.deployContract('PollinationEscrow');
    await escrow.waitForDeployment();
    await (await escrow.setOracle(oracle.address, true)).wait();
    await (await escrow.connect(oracle).reportUptime(beekeeper.address, 1000)).wait();
    await expect(escrow.connect(beekeeper).claimCredit()).to.be.revertedWith('uptime insufficient');
  });

  it('rejects non oracle uptime reports', async () => {
    const [, beekeeper] = await ethers.getSigners();
    const escrow = await ethers.deployContract('PollinationEscrow');
    await escrow.waitForDeployment();
    await expect(escrow.connect(beekeeper).reportUptime(beekeeper.address, 1000)).to.be.revertedWith('not oracle');
  });

  it('releases credit once after required uptime', async () => {
    const [owner, oracle, beekeeper] = await ethers.getSigners();
    const escrow = await ethers.deployContract('PollinationEscrow');
    await escrow.waitForDeployment();
    await (await escrow.setOracle(oracle.address, true)).wait();
    await (await escrow.connect(owner).fundEscrow({ value: ethers.parseEther('2') })).wait();
    expect(await escrow.escrowBalance()).to.equal(ethers.parseEther('2'));
    await (await escrow.connect(oracle).reportUptime(beekeeper.address, 30 * 24 * 60 * 60)).wait();
    const before = await ethers.provider.getBalance(beekeeper.address);
    await (await escrow.connect(beekeeper).claimCredit()).wait();
    const after = await ethers.provider.getBalance(beekeeper.address);
    expect(after).to.be.gt(before);
    expect(await escrow.escrowBalance()).to.equal(ethers.parseEther('1'));
    await expect(escrow.connect(beekeeper).claimCredit()).to.be.revertedWith('already claimed');
  });
});
