package bzq.shf.forms;

public class TeamForm extends OrgUnitTableForm {

	
	private static final long serialVersionUID = -3684421041473769290L;
	protected int buildingId;
	protected String buildingName;
	
	static {	
	    fieldsMapping.put("BUILDING_ID" , "buildingId");
	    fieldsMapping.put("BUILDING_NAME" , "buildingName");
	}

	public int getBuildingId() {
		return buildingId;
	}

	public void setBuildingId(int buildingId) {
		this.buildingId = buildingId;
	}

	public String getBuildingName() {
		return buildingName;
	}

	public void setBuildingName(String buildingName) {
		this.buildingName = buildingName;
	}
	
	
}
