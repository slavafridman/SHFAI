/*
 * Created on Dec 30, 2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.dao;

import java.util.Vector;

import bzq.forms.BaseForm;
import bzq.shf.utils.ShfException;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public abstract class FactoryAdminDao {
	public static final int EVENT_REASON = 1;
	public static final int SKILL_TABLE = 6;
	
	public abstract boolean delete(int id) throws ShfException;
	public abstract boolean insert(BaseForm bf) throws ShfException;
	public abstract boolean update(BaseForm bf) throws ShfException;
	public abstract Vector select(String param) throws ShfException;
		
	
	  
	  public static FactoryAdminDao getDaoFactory(int whichDaoFactory)	{
		  switch(whichDaoFactory){
			case EVENT_REASON:
				return new EventReasonDao();
			case SKILL_TABLE:
				return new SkillDao();	  		
			default:
				return null;
		  }
	  }

}
