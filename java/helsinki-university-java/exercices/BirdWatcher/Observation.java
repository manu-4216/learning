package exercices.BirdWatcher;

public class Observation {
  private String name;
  private int count;
  
  public Observation(String name) {
      this.name = name;
      // we only create observations for birds actually seen. So they will be created with count 1 
      this.count = 1;
  }
  
  public String getName() {
      return this.name;
  }
  
  public int getCount() {
      return this.count;
  }
  
  public void increment() {
      this.count++;
  }
}

