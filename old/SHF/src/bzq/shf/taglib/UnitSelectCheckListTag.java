package bzq.shf.taglib;

import java.util.Vector;

import bzq.shf.forms.OrgUnitTableForm;
import bzq.shf.profile.UserProfile;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

public class UnitSelectCheckListTag extends CheckListTag {
	
	Vector allowedUnits = null;
	protected String parentunit;
	protected String type;
	
	public Vector<OrgUnitTableForm> getList() {
		
		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
		Vector <OrgUnitTableForm>unitTable = tablesContainer.getTable(tablename);
		
		UserProfile userProfile = (UserProfile) pageContext.getSession().getAttribute("userProfile");
		Vector<String> allowedUnits = userProfile.getAllowedUnits();
		
		Vector<OrgUnitTableForm> units = new Vector<OrgUnitTableForm>();
		
		for (OrgUnitTableForm unit : unitTable) {
			if(unit != null && unit.getType() != null)
				if(unit.getType().equals("-1") || allowedUnits.contains(unit.getCode()))
					if(unit.getType().equals("-1") ||unit.getType().equals(type) ){
						if(parentunit==null || parentunit.equals("-1") || unit.getType().equals("-1") || unit.getParent().equals(parentunit)){
							units.add(unit);
						}
				}
		}

		return units;

	} // END Method
	
	public String getParentunit() {
		return parentunit;
	}


	public void setParentunit(String parentunit) {
		this.parentunit = parentunit;
	}


	public String getType() {
		return type;
	}


	public void setType(String type) {
		this.type = type;
	}

} // END Class
