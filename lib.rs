use anchor_lang::prelude::*;

declare_id!("YOUR_PROGRAM_ID_HERE");

#[program]
pub mod flappy_nft {
    use super::*;

    pub fn initialize_game(ctx: Context<InitializeGame>) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        game_state.authority = ctx.accounts.authority.key();
        game_state.total_players = 0;
        game_state.total_scores_recorded = 0;
        Ok(())
    }

    pub fn submit_score(
        ctx: Context<SubmitScore>,
        twitter_handle: String,
        score: u32,
        difficulty: u8,
        streak: u32,
        powerups: u32,
    ) -> Result<()> {
        let game_state = &mut ctx.accounts.game_state;
        let player_score = &mut ctx.accounts.player_score;

        player_score.player = ctx.accounts.player.key();
        player_score.twitter_handle = twitter_handle;
        player_score.score = score;
        player_score.difficulty = difficulty;
        player_score.streak = streak;
        player_score.powerups_collected = powerups;
        player_score.timestamp = Clock::get()?.unix_timestamp;

        // Check if this is a new player
        if player_score.player == ctx.accounts.player.key() && game_state.total_scores_recorded == 0 {
            game_state.total_players += 1;
        }

        game_state.total_scores_recorded += 1;

        // Emit event
        emit!(ScoreSubmitted {
            player: ctx.accounts.player.key(),
            score,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn update_high_score(
        ctx: Context<UpdateHighScore>,
        new_score: u32,
    ) -> Result<()> {
        let leaderboard_entry = &mut ctx.accounts.leaderboard_entry;
        
        if new_score > leaderboard_entry.score {
            leaderboard_entry.score = new_score;
            leaderboard_entry.updated_at = Clock::get()?.unix_timestamp;

            emit!(HighScoreUpdated {
                player: ctx.accounts.player.key(),
                new_score,
                timestamp: Clock::get()?.unix_timestamp,
            });
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 8 + 8)]
    pub game_state: Account<'info, GameState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitScore<'info> {
    #[account(mut)]
    pub game_state: Account<'info, GameState>,
    #[account(init, payer = player, space = 8 + 32 + 100 + 4 + 1 + 4 + 4 + 8)]
    pub player_score: Account<'info, PlayerScore>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateHighScore<'info> {
    #[account(mut)]
    pub leaderboard_entry: Account<'info, LeaderboardEntry>,
    pub player: Signer<'info>,
}

#[account]
pub struct GameState {
    pub authority: Pubkey,
    pub total_players: u64,
    pub total_scores_recorded: u64,
}

#[account]
pub struct PlayerScore {
    pub player: Pubkey,
    pub twitter_handle: String,
    pub score: u32,
    pub difficulty: u8,
    pub streak: u32,
    pub powerups_collected: u32,
    pub timestamp: i64,
}

#[account]
pub struct LeaderboardEntry {
    pub player: Pubkey,
    pub score: u32,
    pub difficulty: u8,
    pub updated_at: i64,
}

#[event]
pub struct ScoreSubmitted {
    pub player: Pubkey,
    pub score: u32,
    pub timestamp: i64,
}

#[event]
pub struct HighScoreUpdated {
    pub player: Pubkey,
    pub new_score: u32,
    pub timestamp: i64,
}
