import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('HoneyBatch1155', () => {
  const tokenId = 8892n;

  const deploy = async () => {
    const [, backend, beekeeper] = await ethers.getSigners();
    const batch = await ethers.deployContract('HoneyBatch1155');
    await batch.waitForDeployment();
    await (await batch.setReconciler(backend.address, true)).wait();
    return { batch, backend, beekeeper };
  };

  it('rejects non reconciler lifecycle calls', async () => {
    const { batch, beekeeper } = await deploy();
    await expect(batch.connect(beekeeper).logBatch(tokenId, beekeeper.address, ethers.id('m1'))).to.be.revertedWith(
      'not reconciler',
    );
  });

  it('enforces state order', async () => {
    const { batch, backend, beekeeper } = await deploy();
    await expect(batch.connect(backend).attachLab(tokenId, ethers.id('m2'))).to.be.revertedWith('state');
    await (await batch.connect(backend).logBatch(tokenId, beekeeper.address, ethers.id('m1'))).wait();
    await expect(batch.connect(backend).synthesize(tokenId, ethers.id('m3'), true)).to.be.revertedWith('state');
  });

  it('blocks minting when verdict is rejected', async () => {
    const { batch, backend, beekeeper } = await deploy();
    await (await batch.connect(backend).logBatch(tokenId, beekeeper.address, ethers.id('m1'))).wait();
    await (await batch.connect(backend).attachLab(tokenId, ethers.id('m2'))).wait();
    await (await batch.connect(backend).synthesize(tokenId, ethers.id('m3'), false)).wait();
    await expect(batch.connect(backend).mint(tokenId, 500)).to.be.revertedWith('mint rejected');
    const b = await batch.batches(tokenId);
    expect(b.state).to.equal(3n);
    expect(b.mintApproved).to.equal(false);
  });

  it('runs full lifecycle to passport generation', async () => {
    const { batch, backend, beekeeper } = await deploy();
    await (await batch.connect(backend).logBatch(tokenId, beekeeper.address, ethers.id('m1'))).wait();
    await (await batch.connect(backend).attachLab(tokenId, ethers.id('m2'))).wait();
    await (await batch.connect(backend).synthesize(tokenId, ethers.id('m3'), true)).wait();
    await (await batch.connect(backend).mint(tokenId, 500)).wait();
    expect(await batch.balanceOf(beekeeper.address, tokenId)).to.equal(500n);
    await (await batch.connect(backend).generatePassport(tokenId, '/passport/HC-2026-8892')).wait();
    const b = await batch.batches(tokenId);
    expect(b.state).to.equal(5n);
    expect(b.reportHash).to.equal(ethers.id('m3'));
  });
});
