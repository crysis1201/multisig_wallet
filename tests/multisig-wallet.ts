import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MultisigWallet } from '../target/types/multisig_wallet'
const assert = require("assert");

describe("multisig-wallet", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);
  

  const program = anchor.workspace.MultisigWallet as Program<MultisigWallet>

  it("Create Multisig", async () => {
    // Add your test here.
    const multisig = anchor.web3.Keypair.generate();
    const[multisigSigner, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [multisig.publicKey.toBuffer()],
      program.programId
    );
    console.log(multisigSigner)
    const multisigSize = 200;

    const ownerA = anchor.web3.Keypair.generate();
    const ownerB = anchor.web3.Keypair.generate();
    const ownerC = anchor.web3.Keypair.generate();

    const owners = [ownerA.publicKey, ownerB.publicKey, ownerC.publicKey]

    const threshold = 2
    const tx = await program.rpc.createAccount(owners, new anchor.BN(threshold), nonce, {
      accounts: {
        multisig: multisig.publicKey,
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

    const pid = program.programId;
    const accounts = [
      {
        pubkey: multisig.publicKey,
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: multisigSigner,
        isWritable: false,
        isSigner: true,
      },
    ];
    //const data = anchor.web3.SystemProgram.transfer({
    //  fromPubkey: multisigSigner,
    //  toPubkey: ownerA.publicKey,
    //  lamports: new anchor.BN(1000000000),
    //}).data

    //create transaction account 
    const transaction = anchor.web3.Keypair.generate();
    const txSize = 1000; // Big enough, cuz I'm lazy.
    const newOwners = [ownerA.publicKey, ownerB.publicKey];
    const data = program.coder.instruction.encode("set_owners_and_change_threshold", {
      owners: newOwners,
      threshold: new anchor.BN(2)
    });

    //const transaction = anchor.web3.Keypair.generate();
    //const txSize = 1000; // Big enough, cuz I'm lazy.
    await program.rpc.createTransaction(pid, accounts, data, {
      accounts: {
        multisig: multisig.publicKey,
        transaction: transaction.publicKey,
        proposer: ownerA.publicKey,
        //rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      instructions: [
        await program.account.transaction.createInstruction(
          transaction,
          txSize
        ),
      ],
      signers: [transaction, ownerA],
    });

    const txAccount = await program.account.transaction.fetch(
      transaction.publicKey
    );

    console.log(txAccount)

    assert.ok(txAccount.programId.equals(pid));
    assert.deepStrictEqual(txAccount.accounts, accounts);
    assert.deepStrictEqual(txAccount.data, data);
    assert.ok(txAccount.multisig.equals(multisig.publicKey));
    assert.deepStrictEqual(txAccount.didExecute, false);

     await program.rpc.approve({
      accounts: {
        multisig: multisig.publicKey,
        transaction: transaction.publicKey,
        owner: ownerB.publicKey,
      },
      signers: [ownerB],
    });

    const txAccout = await program.account.transaction.fetch(
      transaction.publicKey
    );

    assert.deepStrictEqual(txAccout.didReject, false);

    // Now that we've reached the threshold, send the transactoin.
    await program.rpc.executeTransaction({
      accounts: {
        multisig: multisig.publicKey,
        multisigSigner,
        transaction: transaction.publicKey,
      },
      remainingAccounts: program.instruction.setOwnersAndChangeThreshold
        .accounts({
          multisig: multisig.publicKey,
          multisigSigner,
        })
        // Change the signer status on the vendor signer since it's signed by the program, not the client.
        .map((meta) =>
          meta.pubkey.equals(multisigSigner)
            ? { ...meta, isSigner: false }
            : meta
        )
        .concat({
          pubkey: program.programId,
          isWritable: false,
          isSigner: false,
        }),
    });

    multisigAccount = await program.account.multisig.fetch(multisig.publicKey);
    const result = await program.account.transaction.fetch(transaction.publicKey);
    console.log("final", result)

    assert.strictEqual(multisigAccount.nonce, nonce);
    assert.ok(multisigAccount.threshold.eq(new anchor.BN(2)));
    assert.deepStrictEqual(multisigAccount.owners, newOwners);
    assert.ok(multisigAccount.ownerSetSeqno === 1);
  });

  it("Reject Function", async () => {
    // Add your test here.
    const multisig = anchor.web3.Keypair.generate();
    const[multisigSigner, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [multisig.publicKey.toBuffer()],
      program.programId
    );
    console.log(multisigSigner)
    const multisigSize = 200;

    const ownerA = anchor.web3.Keypair.generate();
    const ownerB = anchor.web3.Keypair.generate();
    const ownerC = anchor.web3.Keypair.generate();

    const owners = [ownerA.publicKey, ownerB.publicKey, ownerC.publicKey]

    const threshold = 2
    const tx = await program.rpc.createAccount(owners, new anchor.BN(threshold), nonce, {
      accounts: {
        multisig: multisig.publicKey,
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

    const pid = program.programId;
    const accounts = [
      {
        pubkey: multisig.publicKey,
        isWritable: true,
        isSigner: false,
      },
      {
        pubkey: multisigSigner,
        isWritable: false,
        isSigner: true,
      },
    ];
    const newOwners = [ownerA.publicKey, ownerB.publicKey];
    const data = program.coder.instruction.encode("set_owners_and_change_threshold", {
      owners: newOwners,
      threshold: new anchor.BN(2)
    });

    const transaction = anchor.web3.Keypair.generate();
    const txSize = 1000;
    await program.rpc.createTransaction(pid, accounts, data, {
      accounts: {
        multisig: multisig.publicKey,
        transaction: transaction.publicKey,
        proposer: ownerA.publicKey,
        //rent: anchor.web3.SYSVAR_RENT_PUBKEY
      },
      instructions: [
        await program.account.transaction.createInstruction(
          transaction,
          txSize
        ),
      ],
      signers: [transaction, ownerA],
    });

    const txAccount = await program.account.transaction.fetch(
      transaction.publicKey
    );

    console.log(txAccount)

    assert.ok(txAccount.programId.equals(pid));
    assert.deepStrictEqual(txAccount.accounts, accounts);
    assert.deepStrictEqual(txAccount.data, data);
    assert.ok(txAccount.multisig.equals(multisig.publicKey));
    assert.deepStrictEqual(txAccount.didExecute, false);
    assert.ok(txAccount.ownerSetSeqno === 0);

     await program.rpc.reject({
      accounts: {
        multisig: multisig.publicKey,
        transaction: transaction.publicKey,
        owner: ownerB.publicKey,
      },
      signers: [ownerB],
    });

    const txAccout = await program.account.transaction.fetch(
      transaction.publicKey
    );

    assert.deepStrictEqual(txAccout.didReject, true);
    })

//    async function transfer(from, to) {
//      const instructions = [anchor.web3.SystemProgram.transfer({
//      fromPubkey: from,
//      toPubkey: to,
//      lamports: new anchor.BN(3000000000),
//    }),
//    ]
//  }
});
