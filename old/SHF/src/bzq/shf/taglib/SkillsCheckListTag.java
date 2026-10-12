package bzq.shf.taglib;

import java.util.Vector;

import bzq.shf.forms.TableForm;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

public class SkillsCheckListTag extends CheckListTag {
	
	private static final long serialVersionUID = -2222440496489009597L;

	public Vector getList(){
		TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
	    Vector allskills = tablesContainer.getTable(TablesConstants.SKILL_TABLE);
	    
	    
		Vector<TableForm> skills=new Vector<TableForm>();
		
		TableForm skill=null;
		for(int i=0;i<allskills.size();i++){
			skill=(TableForm)allskills.get(i);
			skills.add(skill);
		}
		
		return skills;
	}
	
	

	
	
}
