package exercices.BirdWatcher;

public class Bird {
    
  private String latinName;
  private String name;

  public Bird(String name, String latinName) {
      this.latinName = latinName;
      this.name = name;
  }

  public String getLatinName() {
      return latinName;
  }

  public String getName() {
      return name;
  }
  
  @Override
  public String toString() {
      return String.format("%s (%s)", this.name, this.latinName);
  }

}
