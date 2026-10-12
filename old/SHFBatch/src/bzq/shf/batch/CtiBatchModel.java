/*
 * Created on 08/12/2009
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.batch;

/**
 * @author 02964437
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class CtiBatchModel {
		
	public CtiBatchModel() {
		super();
	}
	
//	public Date getLastRunDate(DBAccess db) throws ShfException{
//		
//		Date lastDate = new Date();
//		lastDate = null;
//		StringBuffer sql=new StringBuffer();
//		sql.append("select max(t.exec_date) from shifter.shf_batch_docs t where t.process_status=1 ");
//		try{
//			db.prepareStatement(sql.toString());
//			db.executeQuery();
//			db.next();
//			System.out.println("========= "+db.getTimestamp(1)+" ==============");
//		}catch(DBException e){
//			e.printStackTrace();
//		}
//		
//		return lastDate;
//	}
}
