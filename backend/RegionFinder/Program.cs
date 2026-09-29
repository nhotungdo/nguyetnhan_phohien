using System;
using System.Threading.Tasks;
using Npgsql;

class Program
{
    static async Task Main()
    {
        string[] regions = {
            "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-south-1",
            "us-east-1", "us-east-2", "us-west-1", "us-west-2",
            "eu-central-1", "eu-west-1", "eu-west-2", "eu-west-3", "eu-north-1",
            "ca-central-1", "sa-east-1"
        };
        string password = "Donhotung2004";
        string projectRef = "axrvzrwkxavspimnqiqr";

        foreach (var region in regions)
        {
            string host = $"aws-0-{region}.pooler.supabase.com";
            string connString = $"Host={host};Port=6543;Database=postgres;Username=postgres.{projectRef};Password={password};SSL Mode=Require;Trust Server Certificate=true;Timeout=5";
            
            Console.WriteLine($"Trying {region}...");
            try
            {
                using var conn = new NpgsqlConnection(connString);
                await conn.OpenAsync();
                Console.WriteLine($"SUCCESS: Region is {region}!");
                return;
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("not found"))
                {
                    // Tenant not found means wrong region
                }
                else
                {
                    Console.WriteLine($"Error on {region}: {ex.Message}");
                }
            }
        }
        Console.WriteLine("Could not find the correct region.");
    }
}
