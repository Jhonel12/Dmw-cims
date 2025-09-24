<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SetupInventoryDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventory:setup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Setup the inventory database with tables and sample data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Setting up inventory database...');

        // Run migrations
        $this->info('Running migrations...');
        $this->call('migrate');

        // Seed the database
        $this->info('Seeding database with sample data...');
        $this->call('db:seed');

        $this->info('Database setup completed successfully!');
    }
}
