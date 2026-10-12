/*
 * Created on 22/01/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.dao;

import java.util.Vector;

import bzq.forms.BaseForm;
import bzq.shf.transfer.ReplaceMassage;
import bzq.shf.utils.ShfException;

/**
 * @author 03445956
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public abstract class FactoryDao {
	public static final int REPLACE_MASSAGE = 1;
	public final static String MSG_TYPE_OFFER_REPLACE = "OFFER_REPLACE";
	public final static String MSG_TYPE_REJECT_OFFER = "REJECT_OFFER";
	public final static String MSG_TYPE_ACCEPT_OFFER = "ACCEPT_OFFER";
	public final static String MSG_TYPE_CANCEL_OFFER = "CANCEL_OFFER";
	
	public abstract boolean insert(BaseForm bf) throws ShfException;
	public abstract boolean updateToDel(Vector<String> msgs4del) throws ShfException;
	public abstract void updateToRead(Vector<Integer> msgs4read, String empId) throws ShfException;
	public abstract Vector select(String empId) throws ShfException;
//	public abstract boolean isOfferRelevant(ReplaceMassage replaceMessage) throws ShfException;
		
	
	  
	  public static FactoryDao getDaoFactory(int whichDaoFactory)	{
		  switch(whichDaoFactory){
			case REPLACE_MASSAGE:
				return new ReplaceMassageDao();						  		
			default:
				return null;
		  }
	  }


}
