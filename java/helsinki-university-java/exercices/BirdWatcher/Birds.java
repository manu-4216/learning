package exercices.BirdWatcher;

import java.util.ArrayList;

public class Birds {
    private ArrayList<Bird> birds;
    public Birds() {
        birds = new ArrayList<>();
    }
    
    public boolean has(String name) {
        boolean found = false;
        
        for (Bird bird: birds) {
            if (bird.getName().equals(name)) {
                found = true;
                break;
            }
        }
        
        return found;
    }
    
    public void add(String name, String latinName) {
        this.birds.add(new Bird(name, latinName));
    }
    
    public ArrayList<Bird> getAll() {
        return this.birds;
    }
    
    public Bird findByName(String name) {
        for (Bird bird: birds) {
            if (bird.getName().equals(name)) {
                return bird;
            }
        }
        
        return null;
    }
}
