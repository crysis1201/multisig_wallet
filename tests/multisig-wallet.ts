import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MultisigWallet } from '../targeT/types/multisig_wallet'
const assert = require("assert");

describe("multisig-wallet", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.getProvider());

  const program = anchor.workspace.MultisigWallet as Program<MultisigWallet>

  it("Create Multisig", async () => {
    // Add your test here.
    const multisig = anchor.web3.Keypair.generate();
    const[, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [multisig.publicKey.toBuffer()],
      program.programId
    );
    const multisigSize = 200;

    const ownerA = anchor.web3.Keypair.generate();
    const ownerB = anchor.web3.Keypair.generate();
    const ownerC = anchor.web3.Keypair.generate();

    const owners = [ownerA.publicKey, ownerB.publicKey, ownerC.publicKey]

    const threshold = 2
    const tx = await program.rpc.createAccount(owners, new anchor.BN(threshold), nonce, {
      accounts: {
        multisig: multisig.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      instructions: [
        await program.account.multisig.createInstruction(
          multisig,
          multisigSize
        )
      ],
      signers: [multisig]
    })
    console.log(await tx)

    let multisigAccount = await program.account.multisig.fetch(multisig.publicKey);
    console.log({multisigAccount});
    assert.strictEqual(multisigAccount.nonce, nonce);
    assert.ok(multisigAccount.threshold.eq(new anchor.BN(2)));
    assert.deepStrictEqual(multisigAccount.owners, owners);
    assert.ok(multisigAccount.ownerSetSeqno === 0);
  });
})
