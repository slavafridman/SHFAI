package bzq.shf.taglib;

import java.util.Vector;

import bzq.shf.bean.ShiftLocationBean;
import bzq.shf.utils.SHFConstants;
import bzq.taglib.SelectTag;

public class ShiftLocationSelectTag extends SelectTag {

	public Vector<ShiftLocationBean> getTable(){
		
		Vector<ShiftLocationBean> workLocList = new Vector<ShiftLocationBean>();
		
		ShiftLocationBean bean1 = new ShiftLocationBean();
		bean1.setCode(SHFConstants.SHIFT_LOCATION_HOME);
		bean1.setDescription("בית");
		
		ShiftLocationBean bean2 = new ShiftLocationBean();
		bean2.setCode(SHFConstants.SHIFT_LOCATION_SITE);
		bean2.setDescription("מוקד");
		
		workLocList.add(bean1);
		workLocList.add(bean2);
		
		return workLocList;
		
	}
}
