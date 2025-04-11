public class ObjectsExample {
  private String name;
  private int age;

  // custom constructor. NO return type
  public ObjectsExample (String name, int age) {
    this.name = name;
    this.age = age;
  }

  // Constructor overload
  public ObjectsExample (String name) {
    // call the other constructor
    this(name, 0);
  }

  // string representation of an object
  @Override
  public String toString() {
    return this.name + ", age " + this.age + " years";
  }
}

// Usage inside main
// ObjectsExample alex = new ObjectsExample("Alex", 37);
// System.out.println(alex); // same as System.out.println(alex.toString());

// Simple Object:
class Results {
  int wins;
  int losses;

  public Results(int wins, int losses) {
      this.wins = wins;
      this.losses = losses;
  }
}


class Name {
  private String name;

  public Name(String name) {
      this.name = name;
  }

  // no toString override
}

// Usage: 
// Name luke = new Name("Luke");
// System.out.println(luke); // Name@4aa298b7  => Type + identifier

