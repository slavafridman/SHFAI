/*
 * Created on 16/02/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.bean;

import java.util.HashMap;
import java.util.Vector;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class ShiftTreeNodeBean extends ShfBaseBean{

	
	int existSum=0;
	int missSum=0;
	int total=0;
	HashMap sons;
	
	public ShiftTreeNodeBean(){
		sons=new HashMap();
	}
	
	
	/* (non-Javadoc)
	 * @see bzq.shf.bean.ShfBaseBean#getFieldsMapping()
	 */
	public HashMap getFieldsMapping() {
		return null;
	}
	
	public void increaseExistSum(){
		existSum++;
	}
	
	public void increaseMissSum(){
		missSum++;
	}
	
	public void increaseTotal(){
		total++;
	}
	
	/**
	 * @return
	 */
	public int getMissSum() {
		return missSum;
	}

	/**
	 * @return
	 */
	public HashMap getSons() {
		return sons;
	}

	
	/**
	 * @param i
	 */
	public void setMissSum(int i) {
		missSum = i;
	}

	/**
	 * @param map
	 */
	public void setSons(HashMap map) {
		sons = map;
	}

	

	/**
	 * @return
	 */
	public int getExistSum() {
		return existSum;
	}

	/**
	 * @param i
	 */
	public void setExistSum(int i) {
		existSum = i;
	}

	/**
	 * @return
	 */
	public int getTotal() {
		return total;
	}

	/**
	 * @param i
	 */
	public void setTotal(int i) {
		total = i;
	}

}
