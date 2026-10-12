package bzq.shf.taglib;

import java.util.Vector;

import bzq.shf.forms.OrgUnitTableForm;
import bzq.shf.profile.UserProfile;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

public class OrgUnitCheckListTag extends CheckListTag {
	
	protected String parentUnit;
	protected String type;
	
	public Vector getList(){
		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
	    Vector allUnits = tablesContainer.getTable(TablesConstants.UNIT_TABLE);
	    
	    UserProfile userProfile = (UserProfile) pageContext.getSession().getAttribute("userProfile");
		Vector allowedUnits = userProfile.getAllowedUnits();
		
		Vector<OrgUnitTableForm> units=new Vector<OrgUnitTableForm>();
		if(allUnits!=null){
			OrgUnitTableForm unit=null;
			for(int i=0;i<allUnits.size();i++){
				unit=(OrgUnitTableForm)allUnits.get(i);
				if(unit.getParent()!=null && unit.getParent().equals(parentUnit) && unit.getType()!=null && unit.getType().equals(type)){
					units.add(unit);
				}
			}
		}
		
		return units;
	}

	public String getParentUnit() {
		return parentUnit;
	}

	public void setParentUnit(String parent) {
		this.parentUnit = parent;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	
	
	
	
}
