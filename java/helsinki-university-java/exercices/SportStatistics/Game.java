package exercices.SportStatistics;

public class Game {
  private String homeTeam, visitingTeam;
  private int homeTeamPoints, visitingTeamPoints;
  
  public Game(String homeTeam, String visitingTeam, int homeTeamPoints, int visitingTeamPoints) {
      this.homeTeam = homeTeam;
      this.visitingTeam = visitingTeam;
      this.homeTeamPoints = homeTeamPoints;
      this.visitingTeamPoints = visitingTeamPoints;
  }
  
  public String getHomeTeam() {
      return this.homeTeam;
  }
  public String getVisitingTeam() {
      return this.visitingTeam;
  }
  public int getHomeTeamPoints() {
      return this.homeTeamPoints;
  }
  public int getVisitingTeamPoints() {
      return this.visitingTeamPoints;
  }
  public Outcome getOutcomeForTeam(String team) {
      if (!team.equals(homeTeam) && !team.equals(visitingTeam)) {
          return Outcome.NOT_FOUND;
      }

      int teamPoints = team.equals(homeTeam) ? homeTeamPoints : visitingTeamPoints;
      int opponentPoints = team.equals(homeTeam) ? visitingTeamPoints : homeTeamPoints;

      if (teamPoints > opponentPoints) {
          return Outcome.WIN;
      } else if (teamPoints < opponentPoints) {
            return Outcome.LOSS;
      } else {
            return Outcome.DRAW;
      }
    }
}

enum Outcome {
  WIN, LOSS, DRAW, NOT_FOUND
}

