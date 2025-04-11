package exercices.SportStatistics;

import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Scanner;

public class SportStatistics {

    public static void main(String[] args) {
        Scanner scan = new Scanner(System.in);

        System.out.println("File:");
        String file = scan.nextLine();
        
        System.out.println("Team:");
        String team = scan.nextLine();
        
        ArrayList<Game> games = readGamesFromFile(file);
        ArrayList<Game> gamesPlayed = getGamesPlayed(team, games);
        
        Results results = getResults(team, gamesPlayed);
        int wins = results.wins;
        int losses = results.losses;
        
        System.out.println("Games: " + gamesPlayed.size());
        System.out.println("Wins: " + wins);
        System.out.println("Losses: " + losses);
    }
    
    public static ArrayList<Game> getGamesPlayed(String team, ArrayList<Game> games) {
        ArrayList<Game> gamesPlayed = new ArrayList<>();
        
        for (Game game: games) {
            if (team.equals(game.getHomeTeam()) || team.equals(game.getVisitingTeam())) {
                gamesPlayed.add(game);
            }
        }
        
        return gamesPlayed;
    }
    
    public static Results getResults(String team, ArrayList<Game> gamesPlayed) {
        int wins = 0;
        int losses = 0;
        int draws = 0;
        
        for (Game game: gamesPlayed) {
            Outcome outcome = game.getOutcomeForTeam(team);
            
            if (outcome.equals(Outcome.WIN)) {
                wins++;
            } else if (outcome.equals(Outcome.LOSS)) {
                losses++;
            } else if (outcome.equals(Outcome.DRAW)) {
                draws++;
            } else {
                // fine to ignore, since in these games the passed team hasn't played
            }
        }
        
        return new Results(wins, losses);
    }
    
    public static ArrayList<Game> readGamesFromFile(String file) {
        ArrayList<Game> games = new ArrayList<>();
        
        try(Scanner fileReader = new Scanner(Paths.get(file))) {
            while (fileReader.hasNextLine()) {
                String row = fileReader.nextLine();
                String[] parts = row.split(",");
                String homeTeam = parts[0];
                String visitingTeam = parts[1];
                int homeTeamPoints = Integer.valueOf(parts[2]);
                int visitingTeamPoints = Integer.valueOf(parts[3]);
                games.add(new Game(homeTeam, visitingTeam, homeTeamPoints, visitingTeamPoints));
            }
        } catch(Exception e) {
            System.out.println("Error:" + e.getMessage());
        }
        
        return games;
    }

}

class Results {
    int wins;
    int losses;

    public Results(int wins, int losses) {
        this.wins = wins;
        this.losses = losses;
    }
}
