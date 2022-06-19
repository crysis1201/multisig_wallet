use anchor_lang::prelude::*;
use anchor_lang::accounts::program_account::ProgramAccount;

declare_id!("75ed4cXcxNrViHDKhH3apxduALNJ5RDHRQP3kPqf86jd");

#[program]
pub mod multisig_wallet {
    use super::*;

    pub fn create_account(ctx: Context<CreateAccount>, owners: Vec<Pubkey>, threshold: u64, nonce: u8) -> Result<()> {
        let multisig = &mut ctx.accounts.multisig;
        multisig.owners = owners;
        multisig.threshold = threshold;
        multisig.nonce = nonce;
        multisig.owner_set_seqno = 0;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateAccount<'info> {
    #[account(zero)]
    multisig: ProgramAccount<'info, Multisig>,
    rent: Sysvar<'info, Rent>
}

#[account]
pub struct Multisig {
    pub owners: Vec<Pubkey>,
    pub threshold: u64,
    pub nonce: u8,
    pub owner_set_seqno: u32,
}
